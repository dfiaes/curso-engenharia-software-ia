from __future__ import annotations

import json
from collections.abc import Callable

import pytest

from web_http_lab import authn
from web_http_lab.authn import TokenError
from web_http_lab.ssrf import UnsafeUrl, check_public_url

KEY = b"k" * 32
NOW = 1_800_000_000.0
CLAIMS = {"sub": "u1", "iss": "https://auth.test", "aud": "api", "exp": NOW + 60}


def verify(token: str, **overrides: object) -> dict[str, object]:
    kwargs: dict[str, object] = {"issuer": "https://auth.test", "audience": "api", "now": NOW}
    kwargs.update(overrides)
    return authn.verify_jwt(token, KEY, **kwargs)  # type: ignore[arg-type]


def forge(header: dict[str, object], claims: dict[str, object], signature: str = "") -> str:
    h = authn.b64url_encode(json.dumps(header).encode())
    c = authn.b64url_encode(json.dumps(claims).encode())
    return f"{h}.{c}.{signature}"


# ---- senhas ----
def test_password_round_trip_and_unique_salt() -> None:
    first = authn.hash_password("correct horse", n=2**10)
    second = authn.hash_password("correct horse", n=2**10)
    assert first != second
    assert authn.verify_password("correct horse", first)
    assert not authn.verify_password("correct horsE", first)
    assert first.startswith("scrypt$1024$8$1$")


def test_password_fixed_salt_is_deterministic() -> None:
    a = authn.hash_password("x", n=2**10, salt=b"0" * 16)
    b = authn.hash_password("x", n=2**10, salt=b"0" * 16)
    assert a == b


@pytest.mark.parametrize(
    "encoded",
    [
        "",
        "plain",
        "scrypt$x$8$1$AA$AA",
        "md5$1024$8$1$AA$AA",
        f"scrypt${2**30}$8$1$AA$AA",
        "scrypt$1024$8$1$!!$AA",
    ],
)
def test_verify_password_rejects_malformed_hashes(encoded: str) -> None:
    assert not authn.verify_password("x", encoded)


def test_needs_rehash_when_cost_is_lower_than_target() -> None:
    weak = authn.hash_password("x", n=2**10)
    assert authn.needs_rehash(weak, 2**14)
    assert not authn.needs_rehash(weak, 2**10)
    assert authn.needs_rehash("lixo")


def test_hash_password_refuses_dangerous_parameters() -> None:
    with pytest.raises(ValueError):
        authn.hash_password("x", n=1000)
    with pytest.raises(ValueError):
        authn.hash_password("x", n=2**30)


# ---- JWT ----
def test_jwt_round_trip() -> None:
    assert verify(authn.sign_jwt(CLAIMS, KEY)) == CLAIMS


def test_jwt_audience_may_be_a_list() -> None:
    token = authn.sign_jwt({**CLAIMS, "aud": ["other", "api"]}, KEY)
    assert verify(token)["sub"] == "u1"


@pytest.mark.parametrize(
    ("override", "message"),
    [
        ({"now": NOW + 60}, "expirado"),
        ({"issuer": "https://evil.test"}, "emissor"),
        ({"audience": "other-api"}, "audiência"),
    ],
)
def test_jwt_claim_failures(override: dict[str, object], message: str) -> None:
    with pytest.raises(TokenError, match=message):
        verify(authn.sign_jwt(CLAIMS, KEY), **override)


def test_jwt_leeway_and_nbf() -> None:
    token = authn.sign_jwt({**CLAIMS, "nbf": NOW + 10}, KEY)
    with pytest.raises(TokenError, match="nbf"):
        verify(token)
    assert verify(token, leeway=15)["sub"] == "u1"
    expired = authn.sign_jwt(CLAIMS, KEY)
    assert verify(expired, now=NOW + 61, leeway=5)["sub"] == "u1"


def test_jwt_requires_exp() -> None:
    claims = {k: v for k, v in CLAIMS.items() if k != "exp"}
    with pytest.raises(TokenError, match="exp"):
        verify(authn.sign_jwt(claims, KEY))
    with pytest.raises(TokenError, match="exp"):
        verify(authn.sign_jwt({**claims, "exp": True}, KEY))


def test_jwt_tampered_payload_and_wrong_key_fail() -> None:
    token = authn.sign_jwt(CLAIMS, KEY)
    head, _payload, sig = token.split(".")
    evil = authn.b64url_encode(json.dumps({**CLAIMS, "sub": "admin"}).encode())
    with pytest.raises(TokenError, match="assinatura"):
        verify(f"{head}.{evil}.{sig}")
    with pytest.raises(TokenError, match="assinatura"):
        authn.verify_jwt(token, b"x" * 32, issuer="https://auth.test", audience="api", now=NOW)


@pytest.mark.parametrize("alg", ["none", "None", "HS512", "RS256", "hs256", ""])
def test_jwt_algorithm_is_pinned(alg: str) -> None:
    with pytest.raises(TokenError, match="algoritmo"):
        verify(forge({"alg": alg, "typ": "JWT"}, CLAIMS))


def test_jwt_rejects_key_injection_headers() -> None:
    with pytest.raises(TokenError, match="jku"):
        verify(forge({"alg": "HS256", "jku": "https://evil.test/keys"}, CLAIMS))


@pytest.mark.parametrize("token", ["", "a.b", "a.b.c.d", "!!.@@.##", "e30.e30"])
def test_jwt_malformed(token: str) -> None:
    with pytest.raises(TokenError):
        verify(token)


# ---- PKCE ----
def test_pkce_rfc7636_appendix_b_vector() -> None:
    verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
    assert authn.code_challenge(verifier) == challenge
    assert authn.verify_pkce(verifier, challenge)


def test_pkce_negative_controls() -> None:
    verifier = authn.new_code_verifier()
    assert len(verifier) == 43
    challenge = authn.code_challenge(verifier)
    assert not authn.verify_pkce(authn.new_code_verifier(), challenge)
    assert not authn.verify_pkce("curto", challenge)
    with pytest.raises(ValueError):
        authn.code_challenge("curto")


# ---- SSRF ----
def resolver(table: dict[str, list[str]]) -> Callable[[str], list[str]]:
    return lambda host: table[host]


@pytest.mark.parametrize(
    "ip",
    [
        "127.0.0.1",
        "10.1.2.3",
        "172.16.0.9",
        "192.168.0.1",
        "169.254.169.254",
        "100.64.0.1",
        "0.0.0.0",
        "224.0.0.1",
        "::1",
        "fe80::1",
        "fc00::1",
        "::ffff:127.0.0.1",
        "::ffff:169.254.169.254",
    ],
)
def test_private_and_special_addresses_are_blocked(ip: str) -> None:
    with pytest.raises(UnsafeUrl):
        check_public_url("https://x.test/", resolver({"x.test": [ip]}))


def test_public_host_is_allowed_and_ips_returned() -> None:
    assert check_public_url("https://api.test/v1", resolver({"api.test": ["93.184.216.34"]})) == [
        "93.184.216.34"
    ]


def test_one_bad_record_among_good_ones_blocks() -> None:
    table = {"mix.test": ["93.184.216.34", "10.0.0.5"]}
    with pytest.raises(UnsafeUrl):
        check_public_url("https://mix.test/", resolver(table))


@pytest.mark.parametrize(
    "url",
    [
        "http://api.test/",
        "file:///etc/passwd",
        "gopher://api.test/",
        "https://user:pw@api.test/",
        "https:///nohost",
        "https://api.test:99999/",
        "https://127.0.0.1/",
        "https://[::1]/",
        "https://[::ffff:7f00:1]/",
    ],
)
def test_url_shape_checks(url: str) -> None:
    with pytest.raises(UnsafeUrl):
        check_public_url(url, resolver({"api.test": ["93.184.216.34"]}))


def test_http_can_be_allowed_explicitly_and_empty_resolution_fails() -> None:
    table = {"api.test": ["93.184.216.34"], "void.test": []}
    assert check_public_url("http://api.test/", resolver(table), allowed_schemes=("http", "https"))
    with pytest.raises(UnsafeUrl):
        check_public_url("https://void.test/", resolver(table))

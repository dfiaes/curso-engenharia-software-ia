"""Primitivas de autenticação com a biblioteca padrão: scrypt, JWT HS256 e PKCE (S256)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import re
import secrets
from collections.abc import Mapping
from typing import Any

SCRYPT_N = 2**17
_B64URL = re.compile(r"[A-Za-z0-9_-]*")
_VERIFIER = re.compile(r"[A-Za-z0-9\-._~]{43,128}")
_FORBIDDEN_HEADERS = frozenset({"jku", "jwk", "x5u", "x5c"})


class TokenError(Exception):
    """Token recusado. A mensagem serve ao log, nunca à resposta ao cliente."""


def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def b64url_decode(text: str) -> bytes:
    if not _B64URL.fullmatch(text) or len(text) % 4 == 1:
        raise TokenError("base64url inválido")
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


# ---- senhas ----
def _maxmem(n: int, r: int, p: int) -> int:
    return 128 * r * (n + p + 2) + 1024 * 1024


def hash_password(
    password: str, *, n: int = SCRYPT_N, r: int = 8, p: int = 1, salt: bytes | None = None
) -> str:
    """scrypt com sal aleatório; parâmetros ficam no próprio texto, para poder subi-los depois."""
    if n < 2**4 or n & (n - 1) or n > 2**18 or not 1 <= r <= 16 or not 1 <= p <= 4:
        raise ValueError("parâmetros scrypt fora do intervalo aceito")
    salt = secrets.token_bytes(16) if salt is None else salt
    digest = hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=n, r=r, p=p, maxmem=_maxmem(n, r, p), dklen=32
    )
    return f"scrypt${n}${r}${p}${b64url_encode(salt)}${b64url_encode(digest)}"


def _parse_hash(encoded: str) -> tuple[int, int, int, bytes, bytes] | None:
    parts = encoded.split("$")
    if len(parts) != 6 or parts[0] != "scrypt":
        return None
    try:
        n, r, p = int(parts[1]), int(parts[2]), int(parts[3])
        salt, digest = b64url_decode(parts[4]), b64url_decode(parts[5])
    except ValueError, TokenError:
        return None
    if n < 2**4 or n & (n - 1) or n > 2**18 or not 1 <= r <= 16 or not 1 <= p <= 4:
        return None
    return n, r, p, salt, digest


def verify_password(password: str, encoded: str) -> bool:
    parsed = _parse_hash(encoded)
    if parsed is None:
        return False
    n, r, p, salt, expected = parsed
    actual = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=n,
        r=r,
        p=p,
        maxmem=_maxmem(n, r, p),
        dklen=len(expected),
    )
    return hmac.compare_digest(actual, expected)


def needs_rehash(encoded: str, target_n: int = SCRYPT_N) -> bool:
    parsed = _parse_hash(encoded)
    return parsed is None or parsed[0] < target_n


# ---- JWT HS256 ----
def _json_object(raw: bytes) -> dict[str, Any]:
    try:
        value = json.loads(raw)
    except ValueError as exc:
        raise TokenError("JSON inválido") from exc
    if not isinstance(value, dict):
        raise TokenError("esperado objeto JSON")
    return value


def sign_jwt(claims: Mapping[str, object], key: bytes) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    signing_input = (
        b64url_encode(json.dumps(header, separators=(",", ":")).encode())
        + "."
        + b64url_encode(json.dumps(claims, separators=(",", ":")).encode())
    )
    signature = hmac.new(key, signing_input.encode("ascii"), hashlib.sha256).digest()
    return signing_input + "." + b64url_encode(signature)


def verify_jwt(
    token: str,
    key: bytes,
    *,
    issuer: str,
    audience: str,
    now: float,
    leeway: float = 0.0,
) -> dict[str, Any]:
    """Valida assinatura, algoritmo fixo, exp, nbf, iss e aud. `now` é explícito (testável)."""
    parts = token.split(".")
    if len(parts) != 3:
        raise TokenError("token deve ter três partes")
    header = _json_object(b64url_decode(parts[0]))
    if header.get("alg") != "HS256":
        raise TokenError(f"algoritmo não permitido: {header.get('alg')!r}")
    if _FORBIDDEN_HEADERS & header.keys():
        raise TokenError("cabeçalho tenta indicar a chave (jku/jwk/x5u/x5c)")
    expected = hmac.new(key, f"{parts[0]}.{parts[1]}".encode("ascii"), hashlib.sha256).digest()
    if not hmac.compare_digest(expected, b64url_decode(parts[2])):
        raise TokenError("assinatura inválida")
    claims = _json_object(b64url_decode(parts[1]))
    exp = claims.get("exp")
    if isinstance(exp, bool) or not isinstance(exp, int | float):
        raise TokenError("exp ausente")
    if now - leeway >= exp:
        raise TokenError("token expirado")
    nbf = claims.get("nbf")
    if nbf is not None and (isinstance(nbf, bool) or not isinstance(nbf, int | float)):
        raise TokenError("nbf inválido")
    if nbf is not None and now + leeway < nbf:
        raise TokenError("token ainda não vale (nbf)")
    if claims.get("iss") != issuer:
        raise TokenError("emissor inesperado")
    aud = claims.get("aud")
    if not (aud == audience or (isinstance(aud, list) and audience in aud)):
        raise TokenError("audiência inesperada")
    return claims


# ---- PKCE (RFC 7636) ----
def new_code_verifier() -> str:
    return secrets.token_urlsafe(32)


def code_challenge(verifier: str) -> str:
    if not _VERIFIER.fullmatch(verifier):
        raise ValueError("code_verifier deve ter 43 a 128 caracteres do conjunto não reservado")
    return b64url_encode(hashlib.sha256(verifier.encode("ascii")).digest())


def verify_pkce(verifier: str, challenge: str) -> bool:
    try:
        return hmac.compare_digest(code_challenge(verifier), challenge)
    except ValueError:
        return False

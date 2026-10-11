"""Reader for Git loose objects (SHA-1 repositories).

A loose object is a file ``objects/ab/cdef...`` holding ``zlib(b"<type> <size>\\0<body>")``.
The object id is the SHA-1 of that same uncompressed byte string. Objects that
``git gc`` moved into a packfile are not supported on purpose.
"""

from __future__ import annotations

import hashlib
import re
import zlib
from dataclasses import dataclass, field
from pathlib import Path

HEX40 = re.compile(r"^[0-9a-f]{40}$")
KINDS = ("blob", "tree", "commit", "tag")


class ObjectError(Exception):
    """Base class for every problem reading the object database."""


class ObjectNotFound(ObjectError):
    """No loose object with this id (it may live inside a packfile)."""


class CorruptObject(ObjectError):
    """The file exists but does not decode to the id it is stored under."""


@dataclass(frozen=True)
class GitObject:
    oid: str
    kind: str
    size: int
    body: bytes


@dataclass(frozen=True)
class TreeEntry:
    mode: str
    kind: str
    oid: str
    name: str


@dataclass(frozen=True)
class Commit:
    tree: str
    parents: tuple[str, ...]
    author: str
    committer: str
    message: str
    headers: dict[str, list[str]] = field(default_factory=dict)


def hash_object(kind: str, body: bytes) -> str:
    """Return the id Git gives to an object: SHA-1 of ``<kind> <len>\\0<body>``."""
    if kind not in KINDS:
        raise ValueError(f"tipo de objeto desconhecido: {kind!r}")
    return hashlib.sha1(f"{kind} {len(body)}".encode() + b"\0" + body).hexdigest()


def git_dir(repo: Path) -> Path:
    """Locate the ``.git`` directory; follows the ``gitdir:`` file of a linked worktree."""
    dot_git = repo / ".git"
    if dot_git.is_file():
        text = dot_git.read_text(encoding="utf-8").strip()
        if not text.startswith("gitdir: "):
            raise ObjectError(f"{dot_git} não parece um arquivo gitdir")
        return Path(text.removeprefix("gitdir: "))
    if dot_git.is_dir():
        return dot_git
    if (repo / "objects").is_dir() and (repo / "HEAD").is_file():
        return repo  # bare repository
    raise ObjectError(f"{repo} não é um repositório Git")


def common_dir(gdir: Path) -> Path:
    """Directory holding objects and refs (differs from ``gdir`` in linked worktrees)."""
    marker = gdir / "commondir"
    if marker.is_file():
        return (gdir / marker.read_text(encoding="utf-8").strip()).resolve()
    return gdir


def read_object(gdir: Path, oid: str, *, verify: bool = True) -> GitObject:
    if not HEX40.match(oid):
        raise ObjectError(f"id inválido (esperado 40 hex minúsculos): {oid!r}")
    root = common_dir(gdir)
    path = root / "objects" / oid[:2] / oid[2:]
    if not path.is_file():
        packs = list((root / "objects" / "pack").glob("*.pack"))
        hint = " (há packfiles: o objeto pode estar empacotado)" if packs else ""
        raise ObjectNotFound(f"objeto {oid} não existe como arquivo solto{hint}")
    try:
        raw = zlib.decompress(path.read_bytes())
    except zlib.error as exc:
        raise CorruptObject(f"{oid}: zlib inválido: {exc}") from exc
    header, sep, body = raw.partition(b"\0")
    parts = header.split(b" ")
    if not sep or len(parts) != 2 or not parts[1].isdigit():
        raise CorruptObject(f"{oid}: cabeçalho malformado")
    kind, size = parts[0].decode("ascii", errors="replace"), int(parts[1])
    if kind not in KINDS or size != len(body):
        raise CorruptObject(f"{oid}: tipo ou tamanho não confere com o corpo")
    if verify and hash_object(kind, body) != oid:
        raise CorruptObject(f"{oid}: o conteúdo não gera este hash")
    return GitObject(oid=oid, kind=kind, size=size, body=body)


def parse_tree(body: bytes) -> list[TreeEntry]:
    """Entries are ``<mode> <name>\\0<20 raw bytes of id>``, back to back."""
    entries: list[TreeEntry] = []
    pos = 0
    while pos < len(body):
        space = body.index(b" ", pos)
        nul = body.index(b"\0", space)
        mode = body[pos:space].decode("ascii")
        name = body[space + 1 : nul].decode("utf-8", errors="replace")
        raw_id = body[nul + 1 : nul + 21]
        if len(raw_id) != 20:
            raise CorruptObject("árvore truncada")
        kind = {"40000": "tree", "160000": "commit"}.get(mode, "blob")
        entries.append(TreeEntry(mode=mode, kind=kind, oid=raw_id.hex(), name=name))
        pos = nul + 21
    return entries


def parse_commit(body: bytes) -> Commit:
    head, _, message = body.decode("utf-8", errors="replace").partition("\n\n")
    headers: dict[str, list[str]] = {}
    last = ""
    for line in head.split("\n"):
        if line.startswith(" ") and last:  # continuation line (gpgsig, mergetag)
            headers[last][-1] += "\n" + line[1:]
            continue
        key, _, value = line.partition(" ")
        headers.setdefault(key, []).append(value)
        last = key
    try:
        tree = headers["tree"][0]
    except KeyError as exc:
        raise CorruptObject("commit sem cabeçalho tree") from exc
    return Commit(
        tree=tree,
        parents=tuple(headers.get("parent", [])),
        author=headers.get("author", [""])[0],
        committer=headers.get("committer", [""])[0],
        message=message,
        headers=headers,
    )


def _read_ref_file(path: Path) -> str | None:
    return path.read_text(encoding="utf-8").strip() if path.is_file() else None


def _packed_ref(root: Path, name: str) -> str | None:
    packed = root / "packed-refs"
    if not packed.is_file():
        return None
    for line in packed.read_text(encoding="utf-8").splitlines():
        if line and line[0] not in "#^":
            oid, _, ref = line.partition(" ")
            if ref == name:
                return oid
    return None


def read_head(gdir: Path) -> str:
    """Raw content of HEAD: ``ref: refs/heads/main`` or a detached 40-hex id."""
    head = _read_ref_file(gdir / "HEAD")
    if head is None:
        raise ObjectError("HEAD não existe")
    return head


def resolve_rev(gdir: Path, rev: str) -> str:
    """Resolve HEAD, a full id, or a branch/tag name to a 40-hex id (no ``~`` or ``^``)."""
    root = common_dir(gdir)
    if rev == "HEAD":
        head = read_head(gdir)
        if head.startswith("ref: "):
            return resolve_rev(gdir, head.removeprefix("ref: "))
        return head
    if HEX40.match(rev):
        return rev
    for candidate in (rev, f"refs/{rev}", f"refs/tags/{rev}", f"refs/heads/{rev}"):
        found = _read_ref_file(root / candidate) or _packed_ref(root, candidate)
        if found:
            if found.startswith("ref: "):
                return resolve_rev(gdir, found.removeprefix("ref: "))
            return found
    raise ObjectError(f"não consegui resolver {rev!r}")


def walk_first_parent(gdir: Path, start: str) -> list[tuple[str, Commit]]:
    """Follow first parents from ``start`` back to the root commit."""
    out: list[tuple[str, Commit]] = []
    oid = resolve_rev(gdir, start)
    while True:
        obj = read_object(gdir, oid)
        if obj.kind != "commit":
            raise ObjectError(f"{oid} é {obj.kind}, não commit")
        commit = parse_commit(obj.body)
        out.append((oid, commit))
        if not commit.parents:
            return out
        oid = commit.parents[0]

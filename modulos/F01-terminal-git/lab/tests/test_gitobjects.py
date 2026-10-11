from __future__ import annotations

import subprocess
import zlib
from pathlib import Path

import pytest

from shell_git_lab import gitobjects as go
from shell_git_lab.gitrepo import Repo

from .conftest import needs_git

pytestmark = needs_git

EMPTY_BLOB = "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"


@pytest.fixture
def populated(repo: Repo) -> Repo:
    repo.write("a.txt", "olá\n")
    repo.write("src/b.py", "print(1)\n")
    repo.write("run.sh", "#!/bin/sh\n")
    (repo.path / "run.sh").chmod(0o755)
    repo.commit_all("primeiro")
    repo.write("a.txt", "olá de novo\n")
    repo.commit_all("segundo")
    return repo


def git_out(repo: Repo, *args: str) -> str:
    return repo.git(*args).stdout


def test_hash_matches_git_hash_object(tmp_path: Path) -> None:
    sample = tmp_path / "x"
    sample.write_bytes(b"conte\xc3\xbado\n")
    expected = subprocess.run(
        ["git", "hash-object", str(sample)], capture_output=True, text=True, check=True
    ).stdout.strip()
    assert go.hash_object("blob", sample.read_bytes()) == expected
    assert go.hash_object("blob", b"") == EMPTY_BLOB


def test_reads_blob_tree_and_commit_like_git(populated: Repo) -> None:
    gdir = go.git_dir(populated.path)
    head = go.resolve_rev(gdir, "HEAD")
    assert head == populated.rev("HEAD")

    commit_obj = go.read_object(gdir, head)
    assert commit_obj.kind == "commit"
    commit = go.parse_commit(commit_obj.body)
    assert commit.message.strip() == "segundo"
    assert commit.tree == populated.rev("HEAD^{tree}")
    assert commit.parents == (populated.rev("HEAD~1"),)

    tree = go.parse_tree(go.read_object(gdir, commit.tree).body)
    expected = [
        line.split(maxsplit=3) for line in git_out(populated, "ls-tree", "HEAD").splitlines()
    ]
    got = [[e.mode.zfill(6), e.kind, e.oid, e.name] for e in tree]
    # ls-tree separates name with a tab; split(maxsplit=3) keeps it as the last field
    assert [[m, k, o, n] for m, k, o, n in expected] == got
    assert {e.name: e.mode for e in tree}["run.sh"] == "100755"
    assert {e.name: e.kind for e in tree}["src"] == "tree"

    blob = next(e for e in tree if e.name == "a.txt")
    assert go.read_object(gdir, blob.oid).body.decode() == "olá de novo\n"


def test_same_content_same_blob_across_commits(populated: Repo) -> None:
    gdir = go.git_dir(populated.path)
    first = go.parse_commit(go.read_object(gdir, populated.rev("HEAD~1")).body)
    second = go.parse_commit(go.read_object(gdir, populated.rev("HEAD")).body)
    t1 = {e.name: e.oid for e in go.parse_tree(go.read_object(gdir, first.tree).body)}
    t2 = {e.name: e.oid for e in go.parse_tree(go.read_object(gdir, second.tree).body)}
    assert t1["run.sh"] == t2["run.sh"]  # untouched file: same blob, no copy
    assert t1["a.txt"] != t2["a.txt"]
    assert t1["src"] == t2["src"]  # untouched directory: same subtree


def test_walk_first_parent_matches_git_log(populated: Repo) -> None:
    gdir = go.git_dir(populated.path)
    walked = [oid for oid, _ in go.walk_first_parent(gdir, "main")]
    assert walked == git_out(populated, "rev-list", "--first-parent", "main").split()


def test_resolve_packed_refs_after_pack_refs(populated: Repo) -> None:
    populated.git("tag", "v1")
    populated.git("pack-refs", "--all", "--prune")
    gdir = go.git_dir(populated.path)
    assert not (gdir / "refs" / "heads" / "main").exists()
    assert go.resolve_rev(gdir, "main") == populated.rev("main")
    assert go.resolve_rev(gdir, "v1") == populated.rev("v1")


def test_detached_head_is_a_raw_id(populated: Repo) -> None:
    parent = populated.rev("HEAD~1")
    populated.git("checkout", "-q", "--detach", "HEAD~1")
    gdir = go.git_dir(populated.path)
    assert go.read_head(gdir) == parent
    assert go.resolve_rev(gdir, "HEAD") == parent


def test_linked_worktree_reads_shared_objects(populated: Repo, tmp_path: Path) -> None:
    other = tmp_path / "wt"
    populated.git("worktree", "add", "-q", "-b", "feature", str(other))
    gdir = go.git_dir(other)
    assert gdir != other / ".git"
    assert go.resolve_rev(gdir, "HEAD") == populated.rev("main")
    assert go.read_object(gdir, go.resolve_rev(gdir, "HEAD")).kind == "commit"


def test_annotated_tag_is_its_own_object_kind(populated: Repo) -> None:
    populated.git("tag", "-a", "v2", "-m", "release")
    gdir = go.git_dir(populated.path)
    obj = go.read_object(gdir, go.resolve_rev(gdir, "v2"))
    assert obj.kind == "tag"
    assert f"object {populated.rev('HEAD')}" in obj.body.decode()


def test_corrupted_content_is_detected_by_hash(populated: Repo) -> None:
    gdir = go.git_dir(populated.path)
    oid = populated.rev("HEAD")
    path = gdir / "objects" / oid[:2] / oid[2:]
    path.chmod(0o644)
    forged = zlib.compress(b"commit 5\0forge")
    path.write_bytes(forged)
    with pytest.raises(go.CorruptObject):
        go.read_object(gdir, oid)


def test_hash_check_catches_swapped_valid_object(populated: Repo) -> None:
    """Valid zlib and header, wrong place: only the hash comparison notices."""
    gdir = go.git_dir(populated.path)
    oid = populated.rev("HEAD")
    path = gdir / "objects" / oid[:2] / oid[2:]
    path.chmod(0o644)
    path.write_bytes(zlib.compress(b"blob 3\0abc"))
    with pytest.raises(go.CorruptObject, match="hash"):
        go.read_object(gdir, oid)
    assert (
        go.read_object(gdir, oid, verify=False).body == b"abc"
    )  # control: skipping the check hides it


def test_truncated_zlib_stream_is_corrupt(populated: Repo) -> None:
    gdir = go.git_dir(populated.path)
    oid = populated.rev("HEAD")
    path = gdir / "objects" / oid[:2] / oid[2:]
    path.chmod(0o644)
    path.write_bytes(path.read_bytes()[:10])
    with pytest.raises(go.CorruptObject):
        go.read_object(gdir, oid)


def test_missing_object_and_bad_ids(populated: Repo) -> None:
    gdir = go.git_dir(populated.path)
    with pytest.raises(go.ObjectNotFound):
        go.read_object(gdir, "0" * 40)
    with pytest.raises(go.ObjectError):
        go.read_object(gdir, "xyz")
    with pytest.raises(go.ObjectError):
        go.resolve_rev(gdir, "nao-existe")


def test_after_gc_loose_reader_reports_packfile_hint(populated: Repo) -> None:
    gdir = go.git_dir(populated.path)
    oid = populated.rev("HEAD")
    assert go.read_object(gdir, oid).kind == "commit"
    populated.git("gc", "-q", "--prune=now")
    with pytest.raises(go.ObjectNotFound, match="packfile"):
        go.read_object(gdir, oid)
    assert populated.git("cat-file", "-t", oid).stdout.strip() == "commit"  # git still reads it


def test_not_a_repository(tmp_path: Path) -> None:
    with pytest.raises(go.ObjectError):
        go.git_dir(tmp_path)

"""Command line: inspect objects of a repository or run the reproducible scenarios."""

from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

from shell_git_lab import gitobjects as go
from shell_git_lab.gitrepo import GitMissing, Repo
from shell_git_lab.scenarios import (
    ScenarioError,
    build_bisect_case,
    build_lost_commit,
    find_culprit,
    recover_via_reflog,
)


def _cat(repo: Path, rev: str) -> int:
    gdir = go.git_dir(repo)
    obj = go.read_object(gdir, go.resolve_rev(gdir, rev))
    print(f"{obj.kind} {obj.size} {obj.oid}")
    if obj.kind == "tree":
        for e in go.parse_tree(obj.body):
            print(f"{e.mode:>6} {e.kind} {e.oid}\t{e.name}")
    else:
        sys.stdout.write(obj.body.decode("utf-8", errors="replace"))
    return 0


def _log(repo: Path, rev: str) -> int:
    gdir = go.git_dir(repo)
    for oid, commit in go.walk_first_parent(gdir, rev):
        print(f"{oid[:10]} {commit.message.splitlines()[0] if commit.message else ''}")
    return 0


def _scenario(name: str, dest: str) -> int:
    base = Path(dest) if dest else Path(tempfile.mkdtemp(prefix="f01-scenario-"))
    repo = Repo.init(base)
    print(f"repositório: {repo.path}")
    if name == "reflog":
        lost = build_lost_commit(repo)
        print(f"HEAD após reset --hard: {repo.rev('HEAD')[:10]}")
        print(f"commit 'perdido':       {lost.lost_sha[:10]}")
        found = recover_via_reflog(repo, "importante")
        print(f"recuperado pelo reflog: {found[:10]} (branch rescue)")
        print("recuperação confere" if found == lost.lost_sha else "RECUPERAÇÃO DIVERGE")
        return 0 if found == lost.lost_sha else 1
    case = build_bisect_case(repo)
    found = find_culprit(repo, case.commits[0], case.commits[-1])
    print(f"commits: {len(case.commits)}  culpado esperado: {case.culprit[:10]}")
    print(f"bisect apontou:         {found[:10]}")
    print("bisect confere" if found == case.culprit else "BISECT DIVERGE")
    return 0 if found == case.culprit else 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="shell-git-lab")
    sub = parser.add_subparsers(dest="cmd", required=True)
    cat = sub.add_parser("cat-object", help="mostra um objeto solto (como git cat-file -p)")
    cat.add_argument("repo", type=Path)
    cat.add_argument("rev", help="HEAD, nome de branch/tag ou id de 40 hex")
    log = sub.add_parser("log", help="percorre o primeiro pai a partir de uma revisão")
    log.add_argument("repo", type=Path)
    log.add_argument("rev", nargs="?", default="HEAD")
    sc = sub.add_parser("scenario", help="cenário reproduzível em diretório temporário")
    sc.add_argument("name", choices=["reflog", "bisect"])
    sc.add_argument("--dir", default="", help="diretório vazio (padrão: temporário)")
    args = parser.parse_args(argv)
    try:
        if args.cmd == "cat-object":
            return _cat(args.repo, args.rev)
        if args.cmd == "log":
            return _log(args.repo, args.rev)
        return _scenario(args.name, args.dir)
    except GitMissing as exc:
        print(f"shell-git-lab: {exc}", file=sys.stderr)
        return 3
    except (go.ObjectError, ScenarioError) as exc:
        print(f"shell-git-lab: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

import os
import sys

from pathlib import Path


class Greeter:
    def greet(self) -> str:
        return format_name("mundo")


def format_name(name: str) -> str:
    return name.title()


def main() -> None:
    g = Greeter()
    print(g.greet())
    print(os.name, sys.argv, Path.cwd())

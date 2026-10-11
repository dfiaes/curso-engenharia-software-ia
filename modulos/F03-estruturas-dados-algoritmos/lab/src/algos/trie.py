"""Trie (prefix tree): one edge per character, so lookup costs O(len(word)) regardless of how
many words are stored."""


class _TrieNode:
    __slots__ = ("children", "terminal")

    def __init__(self) -> None:
        self.children: dict[str, _TrieNode] = {}
        self.terminal = False


class Trie:
    def __init__(self) -> None:
        self._root = _TrieNode()
        self._count = 0

    def __len__(self) -> int:
        return self._count

    def add(self, word: str) -> bool:
        node = self._root
        for ch in word:
            node = node.children.setdefault(ch, _TrieNode())
        if node.terminal:
            return False
        node.terminal = True
        self._count += 1
        return True

    def _walk(self, text: str) -> _TrieNode | None:
        node = self._root
        for ch in text:
            nxt = node.children.get(ch)
            if nxt is None:
                return None
            node = nxt
        return node

    def __contains__(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and node.terminal

    def with_prefix(self, prefix: str) -> list[str]:
        """All stored words that start with ``prefix``, in alphabetical order."""
        start = self._walk(prefix)
        if start is None:
            return []
        found: list[str] = []
        stack: list[tuple[_TrieNode, str]] = [(start, prefix)]
        while stack:
            node, text = stack.pop()
            if node.terminal:
                found.append(text)
            # push in reverse so the smallest character is popped (visited) first
            for ch in sorted(node.children, reverse=True):
                stack.append((node.children[ch], text + ch))
        return found

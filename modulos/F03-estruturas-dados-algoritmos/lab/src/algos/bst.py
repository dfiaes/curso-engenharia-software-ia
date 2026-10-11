"""Unbalanced binary search tree and a trie. All loops are iterative, so a degenerate tree
(a linked list in disguise) costs time, not a RecursionError."""

from collections.abc import Iterator

from algos._types import SupportsLessThan


class _Node[K]:
    __slots__ = ("key", "left", "right")

    def __init__(self, key: K) -> None:
        self.key = key
        self.left: _Node[K] | None = None
        self.right: _Node[K] | None = None


class BST[K: SupportsLessThan]:
    """Set of keys ordered by ``<``. No rebalancing: height depends on insertion order."""

    def __init__(self) -> None:
        self._root: _Node[K] | None = None
        self._size = 0

    def __len__(self) -> int:
        return self._size

    def add(self, key: K) -> bool:
        """Insert ``key``; return False if it was already present."""
        if self._root is None:
            self._root = _Node(key)
            self._size = 1
            return True
        node = self._root
        while True:
            if key < node.key:
                if node.left is None:
                    node.left = _Node(key)
                    break
                node = node.left
            elif node.key < key:
                if node.right is None:
                    node.right = _Node(key)
                    break
                node = node.right
            else:
                return False
        self._size += 1
        return True

    def __contains__(self, key: K) -> bool:
        node = self._root
        while node is not None:
            if key < node.key:
                node = node.left
            elif node.key < key:
                node = node.right
            else:
                return True
        return False

    def remove(self, key: K) -> bool:
        parent: _Node[K] | None = None
        node = self._root
        while node is not None and (key < node.key or node.key < key):
            parent = node
            node = node.left if key < node.key else node.right
        if node is None:
            return False
        if node.left is not None and node.right is not None:
            # two children: copy the in-order successor's key here, then unlink the successor
            succ_parent = node
            succ = node.right
            while succ.left is not None:
                succ_parent = succ
                succ = succ.left
            node.key = succ.key
            parent, node = succ_parent, succ
        child = node.left if node.left is not None else node.right
        if parent is None:
            self._root = child
        elif parent.left is node:
            parent.left = child
        else:
            parent.right = child
        self._size -= 1
        return True

    def __iter__(self) -> Iterator[K]:
        """In-order traversal: ascending keys. Explicit stack instead of recursion."""
        stack: list[_Node[K]] = []
        node = self._root
        while stack or node is not None:
            while node is not None:
                stack.append(node)
                node = node.left
            node = stack.pop()
            yield node.key
            node = node.right

    def height(self) -> int:
        """Number of nodes on the longest root-to-leaf path (0 for an empty tree)."""
        if self._root is None:
            return 0
        best = 0
        stack = [(self._root, 1)]
        while stack:
            node, depth = stack.pop()
            best = max(best, depth)
            if node.left is not None:
                stack.append((node.left, depth + 1))
            if node.right is not None:
                stack.append((node.right, depth + 1))
        return best

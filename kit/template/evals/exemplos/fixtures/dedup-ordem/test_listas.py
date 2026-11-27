import unittest
from listas import sem_duplicados


class TestListas(unittest.TestCase):
    def test_ordem(self):
        self.assertEqual(sem_duplicados([3, 1, 3, 2, 1]), [3, 1, 2])

    def test_strings(self):
        self.assertEqual(sem_duplicados(["b", "a", "b"]), ["b", "a"])

    def test_vazia(self):
        self.assertEqual(sem_duplicados([]), [])

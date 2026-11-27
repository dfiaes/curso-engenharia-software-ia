import unittest
from paginacao import paginar


class TestPaginar(unittest.TestCase):
    def test_paginas(self):
        itens = list(range(1, 8))
        self.assertEqual(paginar(itens, 1, 3), [1, 2, 3])
        self.assertEqual(paginar(itens, 3, 3), [7])

    def test_fora(self):
        self.assertEqual(paginar([1, 2], 5, 3), [])

    def test_invalidos(self):
        with self.assertRaises(ValueError):
            paginar([1], 0, 3)
        with self.assertRaises(ValueError):
            paginar([1], 1, 0)

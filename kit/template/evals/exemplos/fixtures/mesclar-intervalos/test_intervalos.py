import unittest
from intervalos import mesclar


class TestMesclar(unittest.TestCase):
    def test_basico(self):
        self.assertEqual(mesclar([[1, 3], [2, 6], [8, 10]]), [(1, 6), (8, 10)])

    def test_desordenado_e_tocando(self):
        self.assertEqual(mesclar([[8, 10], [1, 2], [2, 4]]), [(1, 4), (8, 10)])

    def test_contido(self):
        self.assertEqual(mesclar([[1, 10], [2, 3]]), [(1, 10)])

    def test_vazio_e_nao_modifica(self):
        self.assertEqual(mesclar([]), [])
        entrada = [[5, 6], [1, 2]]
        mesclar(entrada)
        self.assertEqual(entrada, [[5, 6], [1, 2]])

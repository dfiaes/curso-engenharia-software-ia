import unittest
from texto import slugify


class TestSlugify(unittest.TestCase):
    def test_basico(self):
        self.assertEqual(slugify("Olá Mundo"), "ola-mundo")

    def test_pontuacao_e_espacos(self):
        self.assertEqual(slugify("  Preço: R$ 10,50!  "), "preco-r-10-50")

    def test_vazio(self):
        self.assertEqual(slugify("!!!"), "")

import unittest
from estatistica import media


class TestMedia(unittest.TestCase):
    def test_simples(self):
        self.assertEqual(media([2, 4, 6]), 4)

    def test_um_elemento(self):
        self.assertEqual(media([5]), 5)

    def test_vazia(self):
        self.assertEqual(media([]), 0.0)

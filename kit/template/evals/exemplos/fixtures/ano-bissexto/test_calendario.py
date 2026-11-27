import unittest
from calendario import bissexto


class TestBissexto(unittest.TestCase):
    def test_comuns(self):
        self.assertTrue(bissexto(2024))
        self.assertFalse(bissexto(2023))

    def test_seculos(self):
        self.assertFalse(bissexto(1900))
        self.assertTrue(bissexto(2000))

import unittest
from duracao import para_segundos


class TestDuracao(unittest.TestCase):
    def test_formatos(self):
        self.assertEqual(para_segundos("1h30m"), 5400)
        self.assertEqual(para_segundos("45s"), 45)
        self.assertEqual(para_segundos("2h"), 7200)
        self.assertEqual(para_segundos("1h2m3s"), 3723)

    def test_invalidos(self):
        for ruim in ["", "abc", "30", "1m1h", "1h 30m", "-5s", "1h1h"]:
            with self.subTest(ruim=ruim):
                with self.assertRaises(ValueError):
                    para_segundos(ruim)

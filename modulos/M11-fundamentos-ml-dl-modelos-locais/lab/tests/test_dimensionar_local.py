"""Oraculo AT-029: OOM/hibrido recomenda reduzir; sem folga, "API".

Numeros MEDIDOS neste ambiente (via orcamento_vram, 8B):
24 GB/8k/1 -> Q8_0 pleno; 16 GB/8k/1 -> Q8_0 pleno;
8 GB/8k/1 -> Q6_K ctx=2048 (reduzido); 4 GB/8k/1 -> API;
70 GB/131072/4 -> Q8_0 ctx=65536 (reduzido).
Limiares com a recomendacao exata medida.
"""

from dimensionar_local import factivel, recomendar


def test_folgada_devolve_maior_quant() -> None:
    """AT-029: 24 GB comporta Q8_0 pleno em 8k."""
    assert recomendar(24.0, 8192, 1) == "Q8_0 ctx=8192 parallel=1"
    assert factivel(24.0, "Q4_K_M", 8192, 1)


def test_parallel_multiplica_kv_e_inviabiliza() -> None:
    """AT-025/029: mesmo ctx, parallel 4 estoura onde 1 cabe."""
    assert factivel(24.0, "Q4_K_M", 131072, 1) is True  # KV 16 GB, total ~21.8
    assert factivel(24.0, "Q4_K_M", 131072, 4) is False  # KV 64 GB, total ~69.8
    assert factivel(70.0, "Q4_K_M", 8192, 1) is True


def test_curta_reduz_ctx() -> None:
    """AT-029: 8 GB nao cabe Q8 pleno; recomenda Q6_K reduzido."""
    assert recomendar(8.0, 8192, 1) == "Q6_K ctx=2048 parallel=1 (reduzido)"


def test_sem_folga_responde_api() -> None:
    """AT-029: 4 GB nao cabe nem Q3 reduzido: resposta e API."""
    assert recomendar(4.0, 8192, 1) == "API"


def test_concorrencia_alta_reduz_ctx() -> None:
    """AT-029: 70 GB em 131k x4 nao cabe pleno; reduz para 65536."""
    assert recomendar(70.0, 131072, 4) == "Q8_0 ctx=65536 parallel=4 (reduzido)"

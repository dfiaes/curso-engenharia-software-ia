"""Piloto com usuário: honestidade estrutural e kit de recrutamento (M13 B19).

Invariantes:
- **BLOCKED ambiental e estruturalmente garantido**: sem sessão humana real
  registrada no `pilot_log`, nenhuma função devolve validação. O BLOCKED não
  é um texto no markdown, é um tipo de dado e uma exceção.
- Consentimento é pré-requisito de esquema: o scorecard exige o consentimento
  assinalado antes de qualquer métrica; sem ele os dados são rejeitados.
- O kit de recrutamento (roteiro, consentimento, canal, recompensa) é artefato
  pronto para o dia em que houver um humano; valida-se por oráculo estrutural.
- Hipótese rejeitada é resultado legítimo: a decisão inclui "rejeitar".
"""

from __future__ import annotations

from dataclasses import dataclass, field


class PilotBlocked(RuntimeError):
    """Levantada quando se tenta derivar validação sem sessão humana real."""


@dataclass(frozen=True)
class RecruitmentKit:
    roteiro_observacao: tuple[str, ...]
    consentimento_texto: str
    canais: tuple[str, ...]
    recompensa: str
    criterios: tuple[str, ...]

    def validar(self) -> list[str]:
        problemas: list[str] = []
        if len(self.roteiro_observacao) < 4:
            problemas.append("roteiro precisa de >=4 passos de observação")
        if len(self.consentimento_texto) < 120:
            problemas.append("consentimento precisa ser inequívoco e completo")
        if not self.canais:
            problemas.append("sem canal de recrutamento definido")
        return problemas


@dataclass(frozen=True)
class PilotSession:
    participante_id: str  # pseudonimizado; nunca nome real
    consentimento: bool
    tarefa_real: str
    baseline_min: float  # medido antes, sem o produto
    produto_min: float  # medido com o produto
    erros_produto: int
    confianca_pos: int  # 1..5
    repetir: bool
    pagar: bool


@dataclass
class PilotLog:
    sessions: list[PilotSession] = field(default_factory=list)
    rotulo: str = "piloto-humano-real"

    def registrar(self, session: PilotSession) -> None:
        if not session.consentimento:
            raise ValueError("sessão sem consentimento não é registrada")
        if not session.tarefa_real.strip():
            raise ValueError("tarefa real obrigatória")
        self.sessions.append(session)

    def validacao(self) -> dict[str, object]:
        """Validação do problema; levanta PilotBlocked se não houver humano."""
        if not self.sessions:
            raise PilotBlocked(
                "BLOCKED: sem sessão humana real consentida; validação estruturalmente impossível"
            )
        n = len(self.sessions)
        delta = sum(s.baseline_min - s.produto_min for s in self.sessions) / n
        repetiriam = sum(1 for s in self.sessions if s.repetir)
        return {
            "n": n,
            "ganho_medio_min": round(delta, 2),
            "repetiriam": repetiriam,
            "pagariam": sum(1 for s in self.sessions if s.pagar),
            "hipotese": "apoiada" if delta > 0 and repetiriam >= n / 2 else "rejeitada",
        }


DEFAULT_KIT = RecruitmentKit(
    roteiro_observacao=(
        "apresentar contexto sem instrução de uso",
        "observar cadastro e ingestão sem intervenção do autor",
        "observar primeira pergunta e leitura do relatório",
        "coletar dificuldades, confusões e abandonos em tempo real",
        "aplicar scorecard de feedback ao final",
    ),
    consentimento_texto=(
        "Declaro que participo voluntariamente do piloto, que meus dados serão "
        "pseudonimizados, que posso interromper a qualquer momento sem ônus e "
        "que autorizo o uso agregado e anonimizado das métricas observadas."
    ),
    canais=("comunidade local de Python", "rede profissional direta"),
    recompensa="1h de revisão de código do projeto do participante",
    criterios=("usa repositórios Python no dia a dia", "não é o autor", "assinou consentimento"),
)


def decision_statement(log: PilotLog) -> str:
    """Decisão final do bloco: PASS só com dados; caso contrário BLOCKED honesto."""
    try:
        rel = log.validacao()
    except PilotBlocked as exc:
        return str(exc)
    return f"VALIDADO: {rel}"

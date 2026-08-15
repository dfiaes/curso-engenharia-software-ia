# Formação: Engenharia de Software e IA em Python

Repositório de estudo de **Denisson** — da experiência sênior em software corporativo para engenharia de software e sistemas de IA em produção.
**15 módulos + 4 laboratórios transversais · 152 blocos de 2h · 304h · 7 a 10 meses** em ritmo irregular.
Linguagem canônica: **Python**. .NET aparece como ponte mental e em um único corte comparativo do M02A; nunca como trilha paralela ou parte do capstone.

## Comece aqui, nesta ordem

1. **[`docs/como-estudar.md`](docs/como-estudar.md)** — o método. Como começar, como retomar depois de uma pausa, como testar o que ficou. Leia antes de qualquer conteúdo técnico.
2. **[`docs/mapa-conceitual.md`](docs/mapa-conceitual.md)** — a hierarquia LLM → prompt → tool → MCP → RAG → agente → workflow → harness → eval. A defesa contra a sopa de siglas.
3. [`docs/projeto-final.md`](docs/projeto-final.md) — o que você vai construir e por quê.
4. [`CURRICULO.md`](CURRICULO.md) — o mapa completo.
5. [`docs/PLANO-ESTRUTURACAO-CURSO-2026.md`](docs/PLANO-ESTRUTURACAO-CURSO-2026.md) — como a versão 4.0 será concluída.
6. [`modulos/M00-ferramental/README.md`](modulos/M00-ferramental/README.md) — e comece. Hoje.

## Mapa do repositório

```
CLAUDE.md                    constituição — como me ensinar. Leia e edite.
CURRICULO.md                 os 15 módulos, com carga, mini-projetos e checkpoints
PROGRESSO.md                 seu diário. Atualize ao fim de cada bloco de 2h.
docs/
  como-estudar.md            ← o método. Leia primeiro.
  projeto-final.md           as 3 opções de capstone, a recomendação e a arquitetura
  gaps-e-projetos.md         o que dá dinheiro durante o curso e o que dá depois
  ideias-fora-da-caixinha.md 12 produtos que quase ninguém está olhando
  comparativo-fullcycle.md   o que extraí do MBA da FullCycle e onde diferimos
  PLANO-ESTRUTURACAO-CURSO-2026.md plano da versão 4.0 e gates de qualidade
  MATRIZ-RASTREABILIDADE.md   competência → prática → evidência → fonte → status
  POLITICA-FONTES-E-AGNOSTICISMO.md padrões para fontes e portabilidade
  STATUS-IMPLEMENTACAO-CURSO.md placar editorial/técnico (não é o diário do aluno)
  adr/                       seus Architecture Decision Records (meta: 25)
modulos/
  M00-ferramental/           ← comece aqui
  M01..M13/                  módulos numerados da trilha
  M02A-engenharia-software-senior/ fundamentos sênior Python-first
capstone/                    o produto, construído a partir do M03
.claude/
  skills/                    suas skills (incluindo a `tutor-ia`)
  agents/                    seus subagentes
```

## Como falar comigo

| Diga | Eu faço |
|---|---|
| `Voltei` | leio o PROGRESSO, resumo em 5 linhas, aqueço 15 min |
| `Módulo X: explique Y` | explicação direta em Python, com ponte mental opcional quando útil |
| `Módulo X: revise meu código` | revisão de tech lead — aponto, não reescrevo |
| `Estou travado` | uma pista. Você pede o próximo degrau se precisar |
| `Me dá a resposta` | entrego, sem sermão |
| `Checkpoint módulo X` | avaliação sem consulta. **Posso reprovar** |
| `Revisão em espiral` | bloco de revisão dos 3 últimos módulos |
| `Defesa técnica fase N` | entrevista de 30 min, com contraditório |
| `Variação difícil` | versão mais dura do exercício que saiu fácil |

## As regras que eu sigo

Estão no `CLAUDE.md`. As três que mais importam:

- **Python é canônico.** Experiência anterior é usada como ponte apenas quando reduz a carga cognitiva.
- **Nunca entrego a solução do exercício sem você pedir.** Pista → direção → esqueleto → código.
- **Sem elogio vazio.** "Funciona" não é "está certo".

## Regra do bloco de 2h

```
00:00–00:10  reentrada (última entrada do PROGRESSO + 3 últimos commits)
00:10–00:25  recuperação ativa, sem consultar nada
00:25–01:45  trabalho, uma coisa só
01:45–02:00  fechamento: commit + 3 linhas + próximo passo específico
```

O fechamento é inegociável, mesmo no bloco que rendeu pouco. É a ponte para o próximo.

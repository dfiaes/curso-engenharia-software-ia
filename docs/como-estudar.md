# Como estudar

## O caminho

1. **Nivelamento.** Faça o [nivelamento](nivelamento.md) para decidir onde entrar. Quem já trabalha na área costuma começar pela Fase 0 só com os diagnósticos.
2. **Fases.** Siga o [currículo](../CURRICULO.md) em ordem, da Fase 0 (fundamentos) à Fase 4 (especialista e líder). O [estado](../STATUS.md) mostra o que já foi revisado.
3. **Dentro de cada módulo:**
   - **Diagnóstico rápido:** 5 a 8 perguntas no início. Se acertar tudo, vá direto ao checkpoint.
   - **Blocos:** leitura com exemplo trabalhado. Cada bloco termina num ponto em que dá para parar e retomar.
   - **Laboratório guiado:** no fim do módulo, numa cópia descartável (`python3 create_working_copy.py`). Rode, observe, use a tabela de diagnóstico quando algo falhar.
   - **Checkpoint:** perguntas por cenário, sem consulta. Reprovar é permitido; releia o ponto fraco e refaça.

Não há duração obrigatória de sessão. Estude o que o tempo permitir e registre onde parou em [`PROGRESSO.md`](../PROGRESSO.md).

## Com o assistente

As regras completas estão em [`CLAUDE.md`](../CLAUDE.md). Os comandos principais:

| Comando | O que acontece |
|---|---|
| `Explique Y` | explicação direta, com o contexto necessário |
| `Revise meu código` | revisão de tech lead: correção, idiomatismo, testabilidade, segurança, custo |
| `Estou travado` | ajuda no nível que você pedir: pista, direção, esqueleto ou código |
| `Checkpoint <CÓDIGO>` | avaliação sem consulta, uma pergunta por vez (ex.: `Checkpoint F03`) |
| `Voltei` | resumo de 5 linhas de onde você parou |
| `Revisão em espiral` | 10 perguntas dos 3 últimos módulos e refatoração de código antigo |
| `Variação difícil` | versão mais dura de um exercício |

## Se você já é sênior

Use o diagnóstico como filtro: acertou tudo, pule o módulo e faça só o checkpoint. Errou algo, leia apenas o bloco correspondente. Procure as **armadilhas que pegam sênior**: pontos em que a rotina e os frameworks escondem o fundamento (complexidade escondida em uma chamada de biblioteca, semântica de erros e timeouts, isolamento de transação, o que o Git realmente guarda). Se o checkpoint reprovar num ponto que você "sabia", é o sinal de que a revisão valeu.

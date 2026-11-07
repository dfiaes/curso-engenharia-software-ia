# Diário de IA e engenharia: instruções para o agente agendado

Uma edição por dia, gerada às 7h (America/Bahia), cobrindo as últimas 24 horas, publicada no site do curso. Aos domingos, também o resumo da semana. Leitor: engenheiro de software sênior (.NET) que trabalha com IA, roda LLM local em um MacBook M3 Max 48 GB e quer se manter atualizado e aprender.

## Passo a passo

1. **Pesquisar as últimas 24 h** nas fontes abaixo e em temas novos que descobrir. Abra a fonte primária; não escreva a partir de manchete ou título.
2. **Escrever a edição** em `diario/edicoes/AAAA/AAAA-MM-DD.md` (formato abaixo). O nome do arquivo precisa ser igual a `data`.
3. **Rodar o build:**
   ```bash
   python3 tools/build_diario.py
   uv run --with markdown python tools/build_course_portal.py
   ```
   (`build_diario.py` precisa do pacote `markdown`; se faltar, use `uv run --with markdown python tools/build_diario.py`.)
4. **Rodar os testes e a checagem:**
   ```bash
   python3 -m unittest tools/test_build_diario.py
   python3 tools/check_course.py
   ```
5. **Commit e push** na `main`: mensagem `diario: edição AAAA-MM-DD`.

## Formato da edição

Frontmatter YAML simples (aspas nos textos com `:`):

```yaml
---
data: 2026-11-07
titulo: "Manchete do dia"
resumo: "Uma frase."
tags: [engenharia, ferramentas-dev]   # mercado, modelos, ferramentas-dev, llm-local, engenharia, seguranca, regulacao, pesquisa, open-source, cloud; outras podem surgir
modulos_afetados:
  - {modulo: "M05", motivo: "Por que este módulo pode precisar de revisão."}
revisao:                              # 0 a 3 itens, 1 opção correta cada
  - pergunta: "..."
    opcoes:
      - {texto: "...", correta: true}
      - {texto: "...", correta: false}
    porque: "..."
fontes_count: 12                      # igual ao número de itens em "Fontes"
---
```

Corpo, nesta ordem:

- `## Destaques` (2 a 5). Só o que tem impacto real para um engenheiro de software com IA. Cada um com `### N. Título`, **O que aconteceu.**, **Por que importa para você.**, **Como aplicar.** (passo concreto, comando ou decisão) e a linha `Fonte:`.
- `## LLM local no Mac` (quando houver novidade): o que roda no M3 Max 48 GB, memória e quantização, MLX, llama.cpp, Ollama, LM Studio. Números só com fonte e data.
- `## Digest`: todas as notícias relevantes do dia, por categoria, 1 a 2 linhas cada, com link.
- `## Radar de ferramentas`: plugins, MCPs e ferramentas novas ainda não avaliadas.
- `## Fontes`: lista numerada com links; HN, Reddit e X levam o rótulo "(comunidade)".
- Rodapé fixo, em itálico, depois de `---`: `Compilação gerada por IA em <data/hora>, a partir das fontes listadas. Confira antes de agir.`

## Fontes de referência por tema

- **Laboratórios e produtos:** blogs e changelogs de Anthropic, OpenAI, Google/DeepMind, Meta AI, Mistral, Qwen, DeepSeek, Microsoft/GitHub, Cursor e OpenCode.
- **Agentes de código:** docs e releases de Claude Code, Codex, Copilot e Gemini CLI.
- **Protocolos:** especificação e registry do MCP.
- **Modelos e pesquisa:** Hugging Face (trending), arXiv (cs.SE, cs.CL).
- **Análise:** Simon Willison, Latent Space, The Pragmatic Engineer.
- **Comunidade (sempre rotulada):** Hacker News, r/LocalLLaMA, X.
- **LLM local:** mlx-community, releases de llama.cpp, Ollama e LM Studio.
- **Segurança e regulação:** OWASP, NIST, EU AI Act, ANPD.
- **Imprensa técnica:** InfoQ, The Register, Ars Technica (tecnologia).

**Descubra temas novos.** A lista acima não é fechada. Procure o que um engenheiro sênior com IA precisaria saber e não está nela (uma ferramenta, um padrão, uma lei, um incidente) e registre a fonte nova em `## Fontes`. Se um tema novo se repetir por vários dias, sugira-o no resumo semanal.

## Regras

- **Nada sem fonte.** Cada afirmação factual tem link. Se só leu o título, diga ("detalhes não lidos além do título"); se a fonte não abriu, diga.
- **Comunidade sempre rotulada.** HN, Reddit, X e blogs pessoais não são fonte primária; diga "comunidade" e trate como hipótese.
- **Não invente números.** Preço, benchmark, versão e data só aparecem se estiverem na fonte; caso contrário, escreva que não foram divulgados.
- **Dia fraco, edição curta.** Um destaque honesto vale mais que cinco inflados. Mínimo: o destaque, o digest e as fontes.
- **Não edite módulos do curso.** Só sinalize em `modulos_afetados`, com o motivo concreto. A revisão mensal (`diario/fila-revisao-mensal.md`, processo em `docs/ATUALIZACAO.md`) decide. Edições tratadas entram em `diario/revisao-tratadas.txt` (uma data por linha).
- **Distinga data do evento e data da edição.** Se o item é anterior às últimas 24 h, diga a data.

## Resumo semanal (domingo)

Arquivo `diario/semanas/AAAA-Www.md` (semana ISO, por exemplo `2026-W45`), depois de escrever a edição do dia:

```yaml
---
semana: 2026-W45
titulo: "Manchete da semana"
resumo: "Uma frase."
periodo: "02 a 08/11/2026"
---
```

Corpo: as **5 coisas mais importantes da semana**, cada uma com 2 a 3 linhas (o que mudou, por que importa, o que fazer) e o link para a edição de origem (`../edicoes/AAAA/AAAA-MM-DD.html`). Depois, uma linha com temas novos recorrentes e módulos mais sinalizados. Mesmas regras de fonte e rodapé.

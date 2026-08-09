# O que extraí do MBA da FullCycle

Li a grade completa do *MBA em Engenharia de Software com IA* (400h, 6-12 meses, início em 03/08/2026). É um curso sério e bem estruturado. Abaixo: o que copiei, o que deixei de fora de propósito, e onde nós somos melhores para o **seu** caso.

---

## O que eu copiei — e onde entrou

| O que eles têm | Nosso destino | Por quê |
|---|---|---|
| **Spec-Driven Development** (PRD → spec → plano) | **M01, novo** | O maior achado. É o método que faltava — o M00 dava as peças, não o processo |
| **Harness Engineering** (gates, rubricas, artefatos, context anxiety) | **M01, novo** | Vocabulário atual para "como impedir o agente de se perder". Tem literatura e ferramental próprios |
| **Paralelização com subagentes**, waves, orquestrador econômico, tmux | M01 | Produtividade real, aplicável no seu .NET amanhã |
| **Design Docs com IA** (PRD, RFC, C4, Mermaid, runbook, postmortem) | **M04, novo** | Eu só tinha ADR. Vira disciplina inteira — e o seu Capstone *gera* documentação, então você precisa saber o que é uma boa |
| **AI Gateway** (LiteLLM como proxy/router, governança, resiliência) | M05 | Eu tinha "camada agnóstica" genérica. O padrão tem nome, ferramenta e é o que time grande usa |
| **Caching com profundidade** (TTL, cache-aside, LRU/LFU, prompt cache, cache de embedding) | M05 | Eu tratava prompt cache de passagem. É o maior redutor de custo que existe |
| **Acoplamento e Main Sequence** (instabilidade, abstratividade, zonas de dor) | M10 | O melhor achado depois do SDD. Transforma o Capstone de "gerador de doc" em **diagnóstico com número** |
| **A2A (Agent-to-Agent)**, agent cards, composição entre frameworks | M09 | Eu só tinha MCP. A2A chegou cedo o bastante para você sair na frente |
| **12-Factor Agents** | M01 e M08 | Referência canônica. A tese central é a mesma que eu já defendia, agora com nome |
| **Versionamento e registry de prompt** (`prompt.yaml`, histórico, teste automatizado) | M06 | Eu dizia "prompt é código" sem dar o ferramental |
| **Query2Doc, ITER-RETGEN** | M07 | Eu tinha só HyDE |
| **Snapshot testing e estratégias determinísticas para LLM não-determinístico** | M06 | Peça que faltava no arsenal de teste |
| **DevOps/SRE com IA** (anomalia explicada, ChatOps, postmortem automático) | M12 | Você escolheu infra simples, mas *SRE com IA* é competência distinta e vendável |
| **Modelos abertos e execução local** (Ollama, LM Studio) | M11 | E tem um motivo específico seu: cliente que não deixa o código sair da rede |
| **CrewAI e Google ADK** no panorama de frameworks | M08 | Você precisa saber justificar por que escolheu LangGraph, não só usá-lo |
| **Marketing pessoal e posicionamento** | Trilha paralela | Concordo com eles: no seu objetivo de renda, ser bom não basta se ninguém sabe |

**Impacto:** 12 módulos / 195h → **14 módulos / 218h**. Cresceu 12% e ficou bem mais completo.

---

## O que deixei de fora, de propósito

- **Nest.js e TypeORM.** O backend prático deles é **Node/TypeScript**. Você escolheu Python/FastAPI, que é a escolha certa para engenharia de IA — todo o ecossistema (PyTorch, Hugging Face, LangGraph, Pydantic AI) assume runtime Python. Este é o maior descasamento entre o MBA deles e o seu objetivo.
- **Design System com Figma e MCP do Figma.** Você é backend com "queda maior para o backend". Fica como leitura opcional.
- **Prompt engineering como disciplina inteira** (zero-shot, CoT, ToT, Skeleton of Thought, ReAct...). Está diluído nos nossos M01, M05 e M08. Em 2026 técnica de prompt isolada rende menos que context e harness engineering — os modelos ficaram bons demais para catálogo de truque.
- **Provas com nota 7 e certificado do MEC.** Nós não temos diploma. Temos produto no ar, evals rodando e post público — que, para o seu objetivo, prova mais.

---

## Onde nós somos melhores para o seu caso

Isso não é competição — é que o curso deles é para uma turma e o nosso é para você.

1. **GraphRAG e grafo de conhecimento.** A grade deles tem banco vetorial e RAG, e **não tem grafo de conhecimento em lugar nenhum**. Era o termo que você tinha ouvido falar, é o que menos gente sabe, e é o nosso M10 inteiro.
2. **Evals como módulo de primeira classe.** Eles cobrem avaliação espalhada em três disciplinas. Nós temos um módulo dedicado com gate de regressão na CI — e é o principal sinal de contratação em IA em 2026.
3. **Fundamentos de ML/DL com as mãos.** Eles explicam transformer conceitualmente; você vai **implementar** atenção multi-head e ver o loss cair.
4. **Python idiomático vindo de C#.** A tabela de tradução .NET → Python não existe lá porque a turma deles não é toda de .NET. Para você, é a maior alavanca do curso.
5. **Produto de verdade:** multi-tenant, RLS, billing, LGPD, custo unitário, margem. Eles têm "empreendedorismo" como disciplina de carreira; nós temos engenharia de produto vendável.
6. **Personalização.** O Capstone é o seu domínio de .NET legado corporativo, e o `gaps-e-projetos.md` é o seu caminho de renda. Um MBA não pode fazer isso.
7. **Tutoria com contraditório.** A IA tutora deles responde perguntas sobre o conteúdo. Eu reprovo você no checkpoint. É uma diferença de gênero, não de grau.

---

## Vale fazer o MBA também?

Depende do que você quer comprar:

**Vale se você quer** o certificado reconhecido pelo MEC (se isso conta na sua empresa ou num processo seletivo), aulas ao vivo com especialistas, feedback humano nos desafios, e a rede de contatos. Nada disso eu te dou.

**Não vale como substituto**, porque o backend prático é TypeScript e falta a parte de grafo — que é justamente onde você quer profundidade.

**A combinação mais eficiente**, se você tiver o dinheiro e a disposição: fazer os dois, usando o MBA como o "reforço opcional" que já está previsto no nosso currículo, e mantendo o nosso Capstone como projeto — não o deles. Você entregaria o mesmo produto nos dois lugares.

Se for escolher um só e o certificado não for necessário: fique com o nosso e reinvista o valor da mensalidade em créditos de API, que é o insumo que você vai consumir de verdade do M05 em diante.

---

Fonte: [MBA em Engenharia de Software com IA — Full Cycle](https://ia.fullcycle.com.br/mba-ia/), grade consultada em 07/08/2026. *Eles avisam que a grade está sujeita a alteração.*

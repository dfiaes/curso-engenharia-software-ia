# ADR 0001 — Fronteiras em camadas no link-shortener

- **Data:** 2026-09-13
- **Módulo:** M03 (bloco 4)
- **Status:** aceita

## Contexto

O laboratório nasceu com módulos planos (`domain`, `db`, `models`, `counters`).
Enquanto o encurtador tinha dois fluxos, isso bastava. Ao adicionar criação
via HTTP com validação, tradução de conflito e persistência, a rota passaria
a acumular três responsabilidades — e nada impediria um import direto da
rota ao SQLAlchemy, o que tornaria qualquer troca de persistência uma
reescrita do HTTP. A restrição é manter a regra testável sem banco e a
infraestrutura trocável sem tocar na regra, com verificação executável
(AT-013–016).

## Opções consideradas

### Opção A — manter módulos planos
- A favor: menos arquivos, menos indireção, suficiente para o escopo atual.
- Contra: regra e tradução HTTP se misturam na primeira rota; nenhum ponto
  único para a decisão "criar link"; a decadência estrutural não é detectada.

### Opção B — camadas com protocolo e guardrail executável
- A favor: `api` traduz, `services` decide via `Protocol`, `repositories`
  persiste; override troca a infraestrutura em teste; varredura AST rejeita
  import ilegal com exit code.
- Contra: mais arquivos e uma indireção (protocolo) para um domínio pequeno;
  o guardrail precisa de manutenção quando pacotes novos surgirem.

## Decisão

Escolhi **B** porque o custo (alguns arquivos e um protocolo) é fixo e pago
uma vez, enquanto o custo de A (regra espalhada, troca de adapter que exige
reescrita) cresce a cada endpoint e é pago para sempre. O protocolo mantém
o service agnóstico à implementação; o guardrail impede regressão silenciosa.

## Consequências

**Ganhei:** regra testável sem banco (fake em memória); app testável sem
porta (override de dependência); violações de fronteira viram falha de suíte.

**Perdi / aceitei como custo:** indireção extra para ler um fluxo simples;
`FORBIDDEN` em `test_layers.py` precisa ser estendido a cada pacote novo;
o fake precisa acompanhar o protocolo (a suíte acusa divergência de
comportamento, não de assinatura — `mypy --strict` cobre a assinatura).

**O que me faria mudar de ideia:** se o laboratório ganhar workers e filas
(LT02) e o protocolo de repositório síncrono-por-sessão passar a vazar
conceitos de mensageria para o service; ou se a suíte ficar mais lenta por
causa das camadas do que por causa do I/O — aí a indireção deixou de se pagar.

## Notas de produção

1. **Concorrência** — camadas não mudam o perfil: sessão por request, pool
   de 10 no engine; a prova de concorrência continua nos testes de B03/B06.
2. **Falha externa** — erro de banco sobe traduzido (`errors`) ou cru;
   a rota nunca decide retry: política de retry pertence a B07/LT02.
3. **Versionamento** — camadas são código, versionadas com o repo; mudança
   de fronteira exige atualizar `FORBIDDEN`, o ADR e a rastreabilidade.

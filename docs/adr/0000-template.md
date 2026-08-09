# ADR NNNN — <título curto da decisão>

- **Data:** AAAA-MM-DD
- **Módulo:** MXX
- **Status:** proposta | aceita | substituída por ADR-NNNN

## Contexto

Qual era o problema? Que restrições existiam? (prazo, custo, conhecimento, infraestrutura)
Escreva como se explicasse a alguém que chega ao projeto daqui a um ano.

## Opções consideradas

### Opção A — <nome>
- A favor:
- Contra:

### Opção B — <nome>
- A favor:
- Contra:

## Decisão

Escolhi **X** porque ___.

> Esta é a linha que importa. "Escolhi X" sem "porque" não é ADR, é anotação.
> É também exatamente o que separa candidato sênior de candidato staff em entrevista
> de system design: descrever componentes é fácil; defender o trade-off é o teste.

## Consequências

**Ganhei:**

**Perdi / aceitei como custo:**

**O que me faria mudar de ideia:**

## Notas de produção

Responda as três perguntas de sênior, sempre:

1. **Concorrência** — quantas requisições simultâneas isso aguenta? Como sei?
2. **Falha externa** — o que acontece quando a dependência (LLM, banco, fila) satura ou cai?
3. **Versionamento** — como faço deploy e rollback disso sem derrubar produção?

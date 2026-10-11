# RFC: Mover o processamento de extratos para fila durável antes do fechamento de novembro

- Autor: Marina Costa
- Revisores obrigatórios: Rafael Lima (plataforma), Beatriz Souza (dados), Caio Ramos (suporte N3)
- Comentários até: 2026-10-20
- Tipo da decisão: reversível com custo (a fila pode ser removida em um sprint; as mensagens já publicadas não)

## Contexto

O endpoint de importação processa o extrato de forma síncrona. Em setembro, 3 dos 5 timeouts de fechamento vieram de extratos acima de 40 MB, e cada retentativa do cliente duplicou 1 a 2% das conciliações (ticket CON-412, incidente de 2026-09-16).

## Proposta

A API grava o extrato em armazenamento de objetos, publica uma mensagem em fila durável e responde 202 com um identificador. Um worker consome com chave de idempotência por hash do arquivo. O cliente consulta o status por GET. Entrega em duas etapas: worker em modo sombra (2 semanas), depois corte por cliente.

## Alternativas consideradas

- Manter síncrono e aumentar o timeout: resolve 2 dos 3 casos, mantém a duplicação e prende conexões do pool durante o processamento.
- Fila gerenciada em nuvem em vez de fila no PostgreSQL: melhor vazão, mas exige aprovação de segurança que não sai antes de novembro.
- Não fazer nada: o custo de suporte do último fechamento foi de 31 horas-pessoa.

## Riscos e reversibilidade

Risco principal: mensagem presa sem alarme. Sinal: idade da mensagem mais antiga acima de 5 minutos, com alerta. Reversão: feature flag por cliente devolve ao caminho síncrono sem migração de dados. Duplicação continua possível no caminho antigo.

## Perguntas em aberto

Qual o tamanho máximo de extrato aceito pelo cliente maior? Suporte precisa de uma tela de reprocessamento antes do corte?

## Decisão

Decisor: Beatriz Souza. Decidido em 2026-10-22: seguir com a proposta; Rafael registrou discordância sobre a fila no PostgreSQL (ADR-031) e apoia a execução.

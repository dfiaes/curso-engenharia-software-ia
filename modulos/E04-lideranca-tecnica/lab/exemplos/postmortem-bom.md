# Postmortem: Fila de conciliação parada por 2 horas após o deploy de terça

- Data do incidente: 2026-09-16
- Severidade: SEV2
- Comandante do incidente: Ana Prado
- Autor e data da revisão: Ana Prado, 2026-09-18

## Resumo

O deploy das 14:02 introduziu um consumidor que não confirmava mensagens acima de 1 MB. A fila parou até o rollback às 16:05. Nenhum dado foi perdido; 1.200 conciliações atrasaram.

## Impacto

1.200 conciliações atrasadas em até 2 h 3 min, 14 clientes afetados, 9% do orçamento de erro mensal consumido.

## Linha do tempo

- 14:02 deploy da versão 3.8.0
- 14:41 alerta de idade da fila dispara (limite: 30 min)
- 15:10 hipótese de banco lento descartada
- 15:48 mensagem de 2 MB identificada no log do consumidor
- 16:05 rollback concluído

## Causas contribuintes

O teste de carga não inclui mensagens acima de 1 MB. O alerta de fila só dispara após 30 minutos. O consumidor trata falha de confirmação com repetição infinita, sem fila de mensagens mortas. A revisão do PR não tinha checklist para mudanças de consumidor.

## O que funcionou

O rollback automatizado levou 6 minutos. O canal do incidente tinha um comandante nomeado nos primeiros 10 minutos.

## Ações

- Adicionar mensagem de 2 MB ao teste de carga @ana 2026-10-30
- Reduzir o alerta de idade da fila para 5 minutos @caio 2026-10-23
- Criar fila de mensagens mortas com limite de 5 tentativas @marina 2026-11-06

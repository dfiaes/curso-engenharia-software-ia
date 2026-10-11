# Checklist de review de código gerado por IA

Marque cada item com evidência (link, trecho de teste, saída de comando), não com "ok".

Escopo e intenção
- [ ] O PR resolve o problema do ticket e nada além. Diff com arquivos não relacionados foi explicado ou removido.
- [ ] O autor consegue explicar cada decisão não óbvia sem consultar o agente.

Verificação
- [ ] Os testes novos falham sem a mudança (rode o teste contra o código antigo).
- [ ] Os testes não verificam apenas mocks: pelo menos um teste exercita o componente real ou um fake fiel ao contrato.
- [ ] Casos de borda do domínio cobertos (vazio, duplicado, fuso horário, concorrência, entrada hostil).
- [ ] Gates locais e de CI verdes; nenhum teste foi removido, pulado ou enfraquecido.

Plausibilidade perigosa
- [ ] Toda biblioteca, função e flag usada existe na versão fixada (nenhuma API inventada).
- [ ] Tratamento de erro não engole exceção nem devolve valor "plausível" no lugar de falhar.
- [ ] Nenhum segredo, caminho absoluto, URL de teste ou dado real no código, nos fixtures ou nos logs.
- [ ] Dependência nova: nome conferido (typosquatting), licença compatível, mantenedor ativo.

Segurança e dados
- [ ] Entradas externas validadas na fronteira; consultas parametrizadas; autorização checada no servidor.
- [ ] Nenhum dado pessoal enviado a serviço fora da política.

Manutenção
- [ ] Segue as convenções do repositório (nomes, camadas, estilo) e o arquivo de instruções do agente.
- [ ] Duplicação de código existente não foi criada; helpers já presentes foram reutilizados.
- [ ] Tamanho: revisável em até 30 minutos; se não, devolver para dividir.

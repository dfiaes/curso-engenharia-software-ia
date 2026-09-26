# Manifesto de evidências do PRR

O contrato está em [`prr-manifest.schema.json`](prr-manifest.schema.json). O arquivo de execução fica em `evidence/m13/prr-manifest.json` dentro da raiz do módulo.

Cada uma das dez áreas do checklist precisa de um registro. O registro aponta para um arquivo regular, não vazio, dentro da raiz do módulo; o SHA-256 é recalculado sobre os bytes lidos. O caminho não pode ser absoluto, conter `..` nem resolver por symlink para fora da raiz.

O manifesto e cada registro associam as evidências a um `revision_digest` SHA-256 de 64 caracteres hexadecimais minúsculos. O chamador fornece a revisão que está avaliando; tanto o manifesto quanto `reviewed_revision_digest` precisam corresponder. Essa verificação impede reaproveitar sem aviso um manifesto de outra revisão. Não determina como a revisão foi calculada: o processo que invoca o PRR é responsável por fornecer o digest esperado correto.

O campo `status` aceita `PASS`, `FAIL` e `BLOCKED`. Só `PASS` com `returncode` zero pode aprovar. `FAIL` e `BLOCKED` permanecem motivos de NO-GO. `command`, `cwd`, código de saída, resultado observado, revisor, ambiente, cenário, escopo e limitações preservam contexto para auditoria.

O PRR também exige cinco eventos do game day e um recibo produzido pelo fluxo local de B18, que executa o deploy recusado pelo health gate, a recuperação em N-1 e o rollback de B17. O game day não recebe callback nem resultados afirmados pelo chamador. Eventos montados manualmente não produzem recibo e mantêm NO-GO. Após o recibo, a timeline é tupla e não aceita novos registros, preservando os eventos que acompanham a execução. Essa simulação executável comprova apenas o mecanismo local, não a operação de um serviço em produção.

O hash comprova que os bytes atuais correspondem ao digest declarado; não prova que o conteúdo é verdadeiro, suficiente ou correto. A revisão precisa conferir a evidência e seu alcance. A ausência, corrupção ou inconsistência do manifesto produz pendência por requisito, não exceção de sucesso.

Dados históricos não são convertidos automaticamente para este contrato. Uma fixture sintética dos testes demonstra apenas a validação mecânica e não constitui aprovação de release M13.

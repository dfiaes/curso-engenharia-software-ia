# Padrão de qualidade técnica e didática

Guia para quem escreve ou revisa módulos e laboratórios. As regras permanentes estão em [`CLAUDE.md`](../CLAUDE.md); a sequência em [`CURRICULO.md`](../CURRICULO.md); a política de fontes em [`POLITICA-FONTES-E-AGNOSTICISMO.md`](POLITICA-FONTES-E-AGNOSTICISMO.md).

## 1. Régua técnica

Cada tópico relevante responde, proporcionalmente ao escopo:

| Camada | Pergunta | Evidência |
|---|---|---|
| Fundamento | Que problema existe e qual modelo mental explica o mecanismo? | explicação, vocabulário, limites |
| Decisão | Quando usar, quando evitar, que trade-offs importam? | matriz, hipótese ou ADR |
| Implementação | Como construir em Python sem esconder a primitiva? | código completo, ambiente reproduzível |
| Falha | Como quebra, como detectar, como recuperar? | falha semeada, oráculo, diagnóstico |
| Operação | Como medir, proteger e manter? | telemetria, evidência, defesa técnica |

- Separar invariante, padrão aberto e adapter de produto.
- Cobrir caminho feliz, borda, falha injetada e controle negativo.
- Não publicar benchmark, versão ou saída sem data e método.
- Revisar código gerado por IA pelos mesmos contratos do código humano.

## 2. Estrutura de um bloco

1. **Situação:** a tarefa, falha ou custo que torna o conceito necessário.
2. **Definição e modelo mental:** o que é, em linguagem direta, antes da API ou do comando.
3. **Mecanismo:** o que acontece entre entrada, estado, processamento e efeito.
4. **Exemplo trabalhado:** solução completa com raciocínio e resultado real.
5. **Contraste:** alternativa, anti-padrão ou caso quase correto.
6. **Decisão e limite:** quando ajuda, quando não ajuda, qual alternativa importa.

Cada bloco deve permitir pausa e retomada: abre com o problema e termina num ponto reconhecível. Sigla, ferramenta e sintaxe são introduzidas no ponto de uso. Pré-requisitos ficam explícitos e apontam para o módulo que os ensina.

## 3. Voz

Autor experiente, para leitura autônoma por quem pode ter menos experiência, sem perder precisão. O termo técnico permanece e é definido no primeiro uso. A prosa alterna decisão curta e explicação desenvolvida quando uma relação causal precisa ser construída. Sem conectivos de enchimento, adjetivos grandiosos, aberturas protocolares ou fechamentos de efeito. Cada parágrafo acrescenta contexto, decisão, consequência ou evidência. Ressalvas só para limites técnicos reais.

## 4. Laboratório

O laboratório é a continuação da explicação e fica reunido no fim do módulo (`Laboratório guiado <CÓDIGO>`). Referência versionada em `lab/`; o aluno trabalha numa cópia descartável criada por `create_working_copy.py`, que nunca limpa caminhos fornecidos pelo usuário.

- Passos cumulativos: por que → copie → execute → observe → diagnostique.
- Resultado esperado em cada passo; caso negativo já traz a saída esperada.
- Código copiável corresponde ao `lab/` ou é rotulado como pseudocódigo.
- Saída publicada vem de execução real ou é rotulada como variável.
- Validação técnica com `pytest`, `ruff` e `mypy --strict`; limpeza segura no fim.
- Exemplos no corpo do HTML podem ser lidos sem executar; a prática manual fica no lab.

## 5. Checkpoint

Separado do lab, sem consulta, por cenário, com rubrica "Basta / Reprova". Mede explicação, decisão, diagnóstico e transferência, não repetição do exemplo. Critérios são conhecidos de antemão; a solução de uma tarefa independente não é entregue. Reprovar é permitido e não bloqueia a navegação.

## 6. Evidência e fontes

Afirmações de alto risco (versões, preços, recursos de produto, dados de adoção) levam fonte junto ao texto e data de verificação; revalidar em até 90 dias. Panorama de mercado, quando útil, é seção curta e datada: sinal e fonte, prática que ele torna relevante, ferramentas separadas em núcleo, padrão aberto e adapter, limites do dado. Popularidade não escolhe a arquitetura do aluno.

## 7. Acessibilidade e apresentação

- HTML semântico, hierarquia de headings, idioma e landmarks corretos.
- Teclado, foco visível, contraste e texto redimensionável; nada depende só de cor.
- Tabelas e código com estratégia móvel; sem overflow horizontal da página a 390 px.
- SVG e diagramas com nome e alternativa textual.
- Impressão sem corte ou sobreposição.
- Termos ingleses profissionais preservados e definidos no primeiro uso.

## 8. Autoavaliação N1–N5

Ferramenta do autor para medir a profundidade de um tópico, não etapa de aprovação:

- **N1** reconhece o termo e sabe para que serve.
- **N2** explica o mecanismo com as próprias palavras.
- **N3** implementa e testa o caso comum.
- **N4** diagnostica falhas e escolhe entre alternativas com trade-offs.
- **N5** projeta, opera e defende a decisão num sistema real.

## 9. Lista antes de marcar um módulo como pronto

- [ ] Pré-requisitos, objetivo e saída observável explícitos; diagnóstico rápido presente.
- [ ] Conceitos novos seguem situação → definição → mecanismo → decisão → observação.
- [ ] Exemplo completo executável, contraste e diagnóstico de falha.
- [ ] Lab em cópia descartável, executado de ponta a ponta.
- [ ] Checkpoint por cenário com rubrica.
- [ ] Fontes com data; `python3 tools/check_course.py` sem erro.
- [ ] Desktop, 390 px, teclado e impressão verificados.
- [ ] Estado atualizado em [`STATUS.md`](../STATUS.md); `PROGRESSO.md` intocado.

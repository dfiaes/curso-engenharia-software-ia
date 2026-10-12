# Prompt: onboarding de repositório existente (sessão SÓ-LEITURA)

Use em modo plano/leitura, sem permissão de escrita (exceto os dois arquivos finais, após sua aprovação).

```
Você é um engenheiro entrando neste repositório. NÃO altere nenhum arquivo agora.

1. Mapeie: estrutura de pastas, projetos/módulos, pontos de entrada, dependências externas
   (bancos, filas, APIs), como o código é construído, testado e implantado.
2. Descubra e EXECUTE (somente leitura/seguro) os comandos reais de build, teste e lint.
   Liste os que funcionam, os que falham e por quê. Não invente comandos.
3. Identifique: áreas sem teste, código morto aparente, pontos frágeis (concorrência, dinheiro,
   datas, SQL dinâmico), convenções implícitas (nomes, camadas, tratamento de erro).
4. Proponha, para eu aprovar, o conteúdo de:
   a) docs/architecture.md (visão de contexto, componentes, fluxos principais, dados, ambientes)
   b) AGENTS.md (comandos exatos, estrutura, convenções, limites, armadilhas) usando o modelo do kit
   c) uma lista priorizada de TESTES DE CARACTERIZAÇÃO para as 5 áreas mais arriscadas
5. Liste suas dúvidas e as suposições que fez. Marque o que você NÃO conseguiu verificar.

Responda com os rascunhos e as dúvidas. Só escreva arquivos depois que eu disser "aprovado".
```

Depois da aprovação: peça para gravar `docs/architecture.md` e `AGENTS.md`, e crie os testes de caracterização
(eles documentam o comportamento ATUAL, mesmo que estranho) ANTES de qualquer mudança funcional.

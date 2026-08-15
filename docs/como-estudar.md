# Como estudar

Leia isto antes do M00. É o método, e ele importa mais que o conteúdo — conteúdo bom estudado errado não gruda.

---

## O problema que este método resolve

Você tem ritmo irregular: semana de 20h e semana de 4h. O inimigo não é a falta de tempo — é o **custo de reentrada**. Toda vez que você volta depois de uma pausa, gasta 40 minutos lembrando onde parou, relendo código que você mesmo escreveu, reconstruindo o raciocínio. Três pausas e você perdeu um bloco inteiro só em reentrada.

Tudo abaixo existe para atacar isso. A ideia central é simples: **você não estuda para lembrar; você registra para não precisar lembrar, e testa para descobrir o que não sabe.**

---

## Os três níveis de saber

Você precisa distinguir isso, porque a ilusão de competência é o que faz gente estudar seis meses e não aprender nada.

| Nível | O que é | Como se testa | Vale? |
|---|---|---|---|
| **Reconhecer** | ler e pensar "sim, faz sentido" | nenhum | **Não.** É a ilusão. |
| **Reproduzir** | escrever o código consultando o material | fazer o exercício com a aba aberta | Pouco. É o mínimo. |
| **Recuperar** | explicar e escrever **sem consultar**, e saber quando não usar | checkpoint | **Sim.** É o único que fica. |

Quase todo estudo de dev sênior para na coluna "reconhecer", porque ler documentação é confortável e a sensação de entendimento é real. Ela só não sobrevive a duas semanas.

**Regra prática:** se você não consegue explicar o conceito em voz alta, de memória, para alguém que não é da área, você está no nível 1. Não importa quantas horas leu.

---

## O bloco de 2h — a unidade de tudo

Todo bloco tem a mesma forma. Cronometre; a estrutura é o que protege o tempo.

```
00:00 – 00:10   Reentrada
00:10 – 00:25   Recuperação ativa (o mais importante e o mais chato)
00:25 – 01:45   Trabalho
01:45 – 02:00   Fechamento
```

### 00:00–00:10 · Reentrada
Abra o `PROGRESSO.md` e leia a **sua última entrada**. Só ela. Não releia o módulo inteiro.
Depois abra o `git log` das últimas 3 mensagens de commit. Elas foram escritas por você para este momento — é por isso que a mensagem de commit importa.

Se a pausa foi de mais de duas semanas, não faça isso sozinho: diga `Voltei` no chat. Eu leio, resumo em 5 linhas e aqueço você. Vai economizar 30 minutos.

### 00:10–00:25 · Recuperação ativa
Feche tudo. Papel e caneta, ou um arquivo em branco.

Escreva de memória, sem consultar nada:
- 3 coisas que você aprendeu no bloco anterior;
- 1 coisa do módulo **anterior** ao atual;
- 1 coisa de dois módulos atrás.

Depois confira e marque o que errou. **O erro é o dado.** O que você errou vai para a lista de revisão do próximo bloco.

Isso dói e é chato. É também a única parte comprovadamente responsável por retenção de longo prazo — o esforço de recuperar da memória é o que fortalece o traço. Reler não faz isso; dá a sensação, sem o efeito.

### 00:25–01:45 · Trabalho
Uma coisa só. Não abra a próxima seção enquanto a atual não fechou.

Regra dura: **você digita.** Nada de aceitar sugestão do agente sem entender cada linha. No M00 você aprendeu a pilotar IA — pilotar não é ser passageiro. Quando o agente escrever algo que você não entenderia sozinho, pare e pergunte antes de aceitar.

Se travar por mais de 20 minutos, pare e me diga `estou travado`. Vinte minutos travado é aprendizado; quarenta é desperdício.

### 01:45–02:00 · Fechamento — inegociável
Três coisas, sempre, mesmo que o bloco tenha rendido pouco:

1. **Commit.** Mesmo quebrado. `WIP: extraction working, chunking still failing on nested classes`. Mensagem em inglês (trilha paralela), específica o bastante para ser um bilhete para o seu eu de daqui a três semanas.
2. **Três linhas no `PROGRESSO.md`:** o que fiz, o que entendi, onde travei.
3. **Uma frase de próximo passo**, no imperativo, específica: ~~"continuar o RAG"~~ → **"implementar o reranker cross-encoder no `retrieval/rerank.py` e rodar o eval de recall"**.

Aquela terceira linha é o item de maior retorno do método inteiro. Ela transforma 40 minutos de reentrada em 10.

---

## Como praticar de verdade

### Prática deliberada, não repetição
Repetir o que você já sabe é confortável e inútil. Prática que funciona tem três traços: está logo além da sua capacidade atual, tem feedback rápido, e mira especificamente o que você erra.

Na prática, aqui: quando um exercício sair fácil, **suba a dificuldade em vez de repetir**. Peça a variação difícil. Eu tenho uma para cada módulo.

### A escada de pistas
Quando travar, use nesta ordem — e me diga em que degrau você está:

1. **Reformule o problema em voz alta.** Metade dos travamentos morre aqui.
2. **Leia o erro. Leia mesmo.** Dev sênior tem o vício de escanear stack trace. Leia a linha inteira.
3. **Reduza ao menor caso que reproduz.** Se o pipeline de RAG está errado, teste um documento e uma pergunta.
4. **Peça uma pista** (`estou travado`). Eu dou uma pista, não a resposta.
5. **Peça direção.** "Olhe o parâmetro de chunk overlap."
6. **Peça o esqueleto.** Assinaturas e comentários, sem implementação.
7. **Peça a resposta** (`me dá a resposta`). Sem culpa — mas só depois de subir a escada.

Pular direto para o 7 é o que faz seis meses de curso não virarem competência.

### Intercalação
Não estude um tópico até a exaustão e depois passe ao próximo. Alterne. Cada bloco tem 15 min de recuperação de material antigo justamente por isso. É menos confortável e produz retenção melhor do que estudar em blocos puros.

### Explicar para uma criança
Ao fim de cada módulo, escreva a explicação de um conceito central como se fosse para alguém sem formação técnica. Sem jargão. Onde você recorrer a jargão, é ali que você não entendeu.

Isso tem uso duplo: é o rascunho do seu post público do módulo (trilha de marketing pessoal) e é o treino exato do que se pede numa entrevista quando perguntam "explique isso para um stakeholder não técnico".

---

## Como avaliar o que ficou

Quatro camadas, de mais frequente para mais rara.

### 1. A cada bloco — recuperação ativa (15 min)
Descrita acima. Detecta esquecimento em dias.

### 2. A cada módulo — checkpoint
Você diz `Checkpoint módulo X`. Eu aplico:
- as perguntas conceituais, **sem consulta**, uma por vez;
- verificação de que o código roda e os testes passam;
- verificação dos entregáveis listados no módulo.

**Eu reprovo.** Não é simbólico. Se reprovar, eu digo exatamente o que revisar e proponho um bloco de recuperação. Ser aprovado sem saber é o pior resultado possível — você descobre o buraco três módulos depois, quando ele custa dez vezes mais.

### 3. A cada 3 módulos — revisão em espiral (1 bloco)
Um bloco inteiro sem conteúdo novo:
- eu faço 10 perguntas dos módulos anteriores, sem consulta;
- você refatora um trecho de código antigo com o que aprendeu desde então;
- você atualiza um ADR antigo se mudou de ideia — mudar de ideia registrada é sinal de aprendizado, não de erro.

### 4. A cada fase — defesa técnica (1 bloco)
Ao fim de cada fase, eu te entrevisto como um tech lead entrevistaria: 30 minutos, com contraditório, você defendendo as decisões que tomou. Sem consulta.

É o exercício mais desconfortável do curso e o que mais se aproxima do que você quer ser. Grave o áudio. Ouvir a si mesmo explicando mal é o feedback mais brutal e mais rápido que existe.

---

## Regras por tamanho de semana

| Semana | Blocos | Faça | Não faça |
|---|---|---|---|
| ~4h | 2 | teoria + mini-projeto guiado | não comece exercício sozinho; ele vai ficar pela metade e apodrecer |
| ~10h | 5 | módulo quase inteiro | não pule o checkpoint para "adiantar" |
| ~20h | 10 | módulo inteiro + revisão | não faça dois módulos; a consolidação precisa de tempo de parede |
| 0h | 0 | nada, sem culpa | não tente "compensar" na semana seguinte fazendo o dobro |

**Sobre semanas zeradas:** vão acontecer, e a culpa é mais destrutiva que a pausa. O `PROGRESSO.md` existe exatamente para que uma pausa de três semanas custe 10 minutos, não um módulo. Volte, diga `Voltei`, siga.

---

## O que não fazer

- **Não releia como forma de estudo.** Releitura gera reconhecimento, não recuperação. Se for reler, releia para responder uma pergunta específica.
- **Não assista vídeo sem teclado aberto.** Vídeo é o formato mais passivo que existe. Se for usar Udemy, pause a cada conceito e implemente.
- **Não pule o commit do fechamento**, nem no bloco que rendeu pouco. É a ponte para o próximo.
- **Não deixe o agente escrever código que você não entenderia sozinho.** Isso constrói produto e não constrói você. Nos módulos de aprendizado, use a IA para explicar e revisar; o código-fonte do exercício sai da sua cabeça.
- **Não persiga completude.** Você não vai dominar tudo de cada módulo. Vai dominar o suficiente para construir a peça, e a profundidade real vem no Capstone, quando a peça quebrar em produção.

---

## Cola de comandos

| Diga | Eu faço |
|---|---|
| `Voltei` | leio o PROGRESSO, resumo em 5 linhas, aqueço 15 min |
| `Módulo X: explique Y` | explicação direta em Python, exemplo mínimo, sem pergunta socrática |
| `Estou travado` | uma pista. Você pede o próximo degrau se precisar |
| `Me dá a resposta` | entrego, sem sermão |
| `Módulo X: revise meu código` | revisão de tech lead — aponto, não reescrevo |
| `Checkpoint módulo X` | avaliação sem consulta; posso reprovar |
| `Revisão em espiral` | bloco de revisão dos 3 últimos módulos |
| `Defesa técnica fase N` | entrevista de 30 min com contraditório |
| `Variação difícil` | versão mais dura do exercício que saiu fácil |
| `Explique como se eu fosse leigo` | eu explico sem jargão — depois você tenta e eu corrijo |

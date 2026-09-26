-- Referência NÃO executada pelo lab (exige PostgreSQL + AGE + Docker).
-- Espelha o desenho do bloco 6: um grafo por tenant+repo, travessias
-- das três perguntas. A execução real fica na etapa Docker do lab guiado.

CREATE EXTENSION IF NOT EXISTS age;

-- SELECT create_graph('t42_repo7');

-- 1) O QUE QUEBRA se mudar este método (reversa, com distância e rota)
-- SELECT * FROM cypher('t42_repo7', $$
--   MATCH caminho = (origem:Metodo)-[:CHAMA*1..4]->(alvo:Metodo {fqn: $alvo})
--   RETURN DISTINCT origem.fqn AS afetado,
--                   length(caminho) AS distancia,
--                   [n IN nodes(caminho) | n.fqn] AS rota
--   ORDER BY distancia
-- $$) AS (afetado agtype, distancia agtype, rota agtype);

-- 2) QUE CÓDIGO ESTÁ MORTO (candidato: inalcançável de entry points)
-- SELECT * FROM cypher('t42_repo7', $$
--   MATCH (m:Metodo)
--   WHERE m.publico = true
--     AND NOT EXISTS { MATCH (:EntryPoint)-[:EXPOE]->(:Metodo)-[:CHAMA*0..10]->(m) }
--   RETURN m.fqn AS candidato_morto
-- $$) AS (candidato_morto agtype);

-- Referência NÃO executada pelo lab (exige PostgreSQL + pgvector + Docker).
-- Espelha o desenho do bloco 3: schema, índices e híbrida com RRF.
-- A execução real fica na etapa Docker do Laboratório guiado M07.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id       bigint NOT NULL,
    caminho         text NOT NULL,
    simbolo         text NOT NULL,
    tipo            text NOT NULL,
    linha_ini       int NOT NULL,
    linha_fim       int NOT NULL,
    conteudo        text NOT NULL,
    hash_conteudo   text NOT NULL,
    embedding_model text NOT NULL,
    embedding       vector(64),
    tsv             tsvector GENERATED ALWAYS AS
                      (to_tsvector('simple', coalesce(simbolo,'') || ' ' || conteudo)) STORED,
    visibilidade    text NOT NULL DEFAULT 'interna',
    UNIQUE (caminho, simbolo)
);

CREATE INDEX ix_chunks_tenant ON chunks (tenant_id);
CREATE INDEX ix_chunks_tsv ON chunks USING gin (tsv);
CREATE INDEX ix_chunks_embedding ON chunks
    USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Híbrida com RRF (bloco 4): ACL em cada CTE, fusão por posição, k=60.
-- (Consulta completa no material; aqui o contrato essencial.)

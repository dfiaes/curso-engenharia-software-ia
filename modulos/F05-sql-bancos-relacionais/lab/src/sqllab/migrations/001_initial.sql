-- 001: base schema of the library domain (3NF).
CREATE TABLE author (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    born_year   INTEGER CHECK (born_year BETWEEN 1000 AND 2100)
);

CREATE TABLE category (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    parent_id   INTEGER REFERENCES category (id)
);

CREATE TABLE book (
    id              INTEGER PRIMARY KEY,
    isbn            TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    author_id       INTEGER NOT NULL REFERENCES author (id),
    category_id     INTEGER REFERENCES category (id),
    published_year  INTEGER,
    copies          INTEGER NOT NULL DEFAULT 1 CHECK (copies >= 0)
);

CREATE TABLE member (
    id           INTEGER PRIMARY KEY,
    email        TEXT NOT NULL UNIQUE,
    name         TEXT NOT NULL,
    joined_on    TEXT NOT NULL,
    referred_by  INTEGER REFERENCES member (id)
);

CREATE TABLE loan (
    id           INTEGER PRIMARY KEY,
    book_id      INTEGER NOT NULL REFERENCES book (id),
    member_id    INTEGER NOT NULL REFERENCES member (id),
    loaned_on    TEXT NOT NULL,
    due_on       TEXT NOT NULL,
    returned_on  TEXT,
    CHECK (due_on >= loaned_on)
);

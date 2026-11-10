CREATE TABLE aluno (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    materia VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE questao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enunciado TEXT NOT NULL,
    materia VARCHAR(255) NOT NULL,
    resposta TEXT,
    alternativa_correta VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE resposta_aluno (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id INTEGER NOT NULL REFERENCES aluno(id) ON DELETE CASCADE,
    questao_id INTEGER NOT NULL REFERENCES questao(id) ON DELETE CASCADE,
    resposta_marcada VARCHAR(255) NOT NULL,
    correta BOOLEAN NOT NULL,
    respondida_em DATETIME NOT NULL
);

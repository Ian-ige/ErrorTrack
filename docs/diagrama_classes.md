# Diagrama de classes do domínio

```mermaid
classDiagram
    class Aluno {
        +int id
        +string name
        +string materia
        +datetime created_at
        +salvar()
        +atualizar()
        +deletar()
        +listar_todos()
        +buscar_por_id()
        +to_dict()
    }

    class Questao {
        +int id
        +string enunciado
        +string materia
        +string resposta
        +string alternativa_correta
        +datetime created_at
        +salvar()
        +atualizar()
        +deletar()
        +listar_todas()
        +buscar_por_id()
        +to_dict()
    }

    class RespostaAluno {
        +int id
        +int aluno_id
        +int questao_id
        +string resposta_marcada
        +boolean correta
        +datetime respondida_em
        +salvar()
        +listar_todos()
        +buscar_por_id()
        +deletar()
        +to_dict()
    }

    Aluno "1" --> "0..*" RespostaAluno : registra
    Questao "1" --> "0..*" RespostaAluno : recebe
```

Cada `RespostaAluno` pertence a um aluno e a uma questão. A relação usa chaves estrangeiras; a exclusão de um aluno ou questão remove as respostas associadas por cascata. Não há herança entre as entidades do domínio.

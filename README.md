# ErrorTrack

Sistema de apoio aos estudos que organiza alunos, questões, respostas e relatórios de erros para ajudar a identificar conteúdos que precisam de revisão.

## Tecnologias

- Frontend: HTML, CSS e JavaScript
- Backend: Python e Flask
- Persistência: SQLAlchemy com SQLite por padrão
- Arquitetura: Controller, Service, Model e Repository

## Como executar

1. Instale Python 3.10 ou superior.
2. Abra um terminal na pasta do projeto.
3. Crie e ative um ambiente virtual.
4. Instale as dependências com `pip install -r requirements.txt`.
5. Entre na pasta `backend`.
6. Execute `python app.py`.
7. Acesse `http://127.0.0.1:5000`.

O banco SQLite é criado automaticamente na primeira execução. Para usar outra base compatível com SQLAlchemy, configure `DATABASE_URL` como variável de ambiente. Não publique chaves, senhas ou arquivos `.env`.

## Funcionalidades Implementadas

1. Cadastrar aluno.
2. Listar alunos cadastrados.
3. Buscar aluno por ID.
4. Buscar alunos por nome.
5. Atualizar dados de aluno.
6. Excluir aluno e seu histórico de respostas.
7. Cadastrar questão.
8. Listar questões cadastradas.
9. Buscar questão por ID.
10. Buscar questões por texto do enunciado.
11. Filtrar questões por matéria.
12. Atualizar enunciado, matéria, alternativa correta e explicação de uma questão.
13. Excluir questão e as respostas relacionadas.
14. Registrar a resposta de um aluno para uma questão.
15. Verificar automaticamente se a resposta está correta.
16. Consultar o histórico de respostas.
17. Filtrar o histórico por aluno.
18. Gerar relatório de questões respondidas incorretamente.
19. Filtrar o relatório de erros por aluno.
20. Exibir resumo de desempenho com total de respostas, acertos, erros e percentual de acerto.
21. Exibir painel geral com indicadores e erros recentes.

## Organização do projeto

- `backend/controllers/`: recebe requisições HTTP e devolve respostas da API.
- `backend/services/`: implementa validações e casos de uso, com um Service por ação.
- `backend/models/`: entidades e operações básicas de persistência.
- `backend/repositories/`: consultas especializadas, filtros e relatórios.
- `frontend/`: telas independentes para visão geral, alunos, questões, registro de respostas e relatórios.
- `docs/diagrama_classes.md`: diagrama de classes do domínio.

## Diagrama de classes

O diagrama de classes está em [`docs/diagrama_classes.md`](docs/diagrama_classes.md) e representa as Models e os relacionamentos implementados no banco.

## Principais rotas da API

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/alunos` | Lista alunos; aceita `?nome=...` |
| POST | `/alunos` | Cadastra aluno |
| GET | `/alunos/<id>` | Busca aluno por ID |
| PUT | `/alunos/<id>` | Atualiza aluno |
| DELETE | `/alunos/<id>` | Exclui aluno |
| GET | `/questoes` | Lista questões; aceita `?busca=...` e `?materia=...` |
| POST | `/questoes` | Cadastra questão |
| GET | `/questoes/<id>` | Busca questão por ID |
| PUT | `/questoes/<id>` | Atualiza questão |
| DELETE | `/questoes/<id>` | Exclui questão |
| GET | `/respostas` | Lista respostas; aceita `?aluno_id=...` |
| POST | `/respostas` | Registra e corrige uma resposta |
| GET | `/relatorios/erros` | Lista respostas incorretas; aceita `?aluno_id=...` |
| GET | `/relatorios/desempenho` | Retorna indicadores de desempenho; aceita `?aluno_id=...` |

## Fluxo arquitetural

Cada ação passa pela interface, rota da API, Controller, Service e Model ou Repository antes de acessar os dados. As consultas especializadas de busca e relatório ficam encapsuladas nos Repositories. As Controllers não executam regras de negócio nem SQL diretamente.

## Demonstração

Grave um vídeo de até 5 minutos mostrando o cadastro, consulta, edição e exclusão de alunos e questões, o registro de respostas e os relatórios atualizados após os testes. O vídeo deve demonstrar as funcionalidades realmente executadas no sistema.

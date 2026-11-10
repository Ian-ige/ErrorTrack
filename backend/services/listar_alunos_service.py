from models.aluno import Aluno
class ListarAlunosService:
    def execute(self):
        return [aluno.to_dict() for aluno in Aluno.listar_todos()]

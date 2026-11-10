from models.aluno import Aluno
class ExcluirAlunoService:
    def execute(self, aluno_id):
        aluno = Aluno.buscar_por_id(aluno_id)
        if not aluno:
            return False
        aluno.deletar()
        return True

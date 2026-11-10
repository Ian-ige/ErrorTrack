from models.aluno import Aluno
class BuscarAlunoPorIdService:
    def execute(self, aluno_id):
        aluno = Aluno.buscar_por_id(aluno_id)
        return aluno.to_dict() if aluno else None

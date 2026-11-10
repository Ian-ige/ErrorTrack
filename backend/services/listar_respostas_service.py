from models.resposta_aluno import RespostaAluno
from repositories.resposta_repository import RespostaRepository
class ListarRespostasService:
    def __init__(self):
        self.repository = RespostaRepository()
    def execute(self, aluno_id=None):
        if aluno_id is not None:
            try:
                aluno_id = int(aluno_id)
            except (TypeError, ValueError):
                raise ValueError("ID do aluno inválido.")
            respostas = self.repository.listar_por_aluno(aluno_id)
        else:
            respostas = RespostaAluno.listar_todos()
        return [resposta.to_dict() for resposta in respostas]

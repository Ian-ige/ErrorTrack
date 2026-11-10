from repositories.questao_repository import QuestaoRepository
class ListarErrosService:
    def __init__(self):
        self.repository = QuestaoRepository()
    def execute(self, aluno_id=None):
        if aluno_id not in (None, ''):
            try:
                aluno_id = int(aluno_id)
            except (TypeError, ValueError):
                raise ValueError("ID do aluno inválido.")
        else:
            aluno_id = None
        return self.repository.gerar_relatorio_erros(aluno_id)

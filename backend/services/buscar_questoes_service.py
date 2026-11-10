from repositories.questao_repository import QuestaoRepository
class BuscarQuestoesService:
    def __init__(self):
        self.repository = QuestaoRepository()
    def execute(self, termo=None, materia=None):
        return [questao.to_dict() for questao in self.repository.buscar_com_filtros(termo, materia)]

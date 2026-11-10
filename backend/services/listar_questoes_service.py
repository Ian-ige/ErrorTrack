from models.questao import Questao
class ListarQuestoesService:
    def execute(self):
        return [questao.to_dict() for questao in Questao.listar_todas()]

from models.questao import Questao
class BuscarQuestaoPorIdService:
    def execute(self, questao_id):
        questao = Questao.buscar_por_id(questao_id)
        return questao.to_dict() if questao else None

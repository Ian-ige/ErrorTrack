from models.questao import Questao
class ExcluirQuestaoService:
    def execute(self, questao_id):
        questao = Questao.buscar_por_id(questao_id)
        if not questao:
            return False
        questao.deletar()
        return True

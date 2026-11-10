from models.questao import Questao
class CadastrarQuestaoService:
    def execute(self, dados):
        enunciado = (dados.get('enunciado') or '').strip()
        materia = (dados.get('materia') or '').strip()
        alternativa = (dados.get('alternativa_correta') or '').strip()
        if not enunciado or not materia or not alternativa:
            raise ValueError("Enunciado, matéria e alternativa correta são obrigatórios.")
        resposta = (dados.get('resposta') or '').strip() or None
        return Questao(enunciado=enunciado, materia=materia, alternativa_correta=alternativa, resposta=resposta).salvar().to_dict()

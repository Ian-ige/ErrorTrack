from models.questao import Questao
class AtualizarQuestaoService:
    def execute(self, questao_id, dados):
        questao = Questao.buscar_por_id(questao_id)
        if not questao:
            return None
        for campo in ('enunciado', 'materia', 'alternativa_correta'):
            if campo in dados and not str(dados[campo] or '').strip():
                raise ValueError(f"{campo} não pode ficar vazio.")
        questao.atualizar(**{campo: str(dados[campo]).strip() for campo in ('enunciado', 'materia', 'alternativa_correta') if campo in dados})
        if 'resposta' in dados:
            questao.atualizar(resposta=(str(dados['resposta']).strip() or None))
        return questao.to_dict()

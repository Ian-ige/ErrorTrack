from models.aluno import Aluno
from models.questao import Questao
from models.resposta_aluno import RespostaAluno
class RegistrarRespostaService:
    def execute(self, dados):
        try:
            aluno_id = int(dados.get('aluno_id'))
            questao_id = int(dados.get('questao_id'))
        except (TypeError, ValueError):
            raise ValueError("Selecione um aluno e uma questão válidos.")
        marcada = (dados.get('resposta_marcada') or '').strip()
        if not marcada:
            raise ValueError("A resposta marcada é obrigatória.")
        aluno = Aluno.buscar_por_id(aluno_id)
        questao = Questao.buscar_por_id(questao_id)
        if not aluno or not questao:
            raise ValueError("Aluno ou questão não encontrado.")
        correta = marcada.casefold() == questao.alternativa_correta.strip().casefold()
        resposta = RespostaAluno(aluno_id=aluno_id, questao_id=questao_id, resposta_marcada=marcada, correta=correta)
        return resposta.salvar().to_dict()

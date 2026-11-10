from flask import Blueprint, jsonify, request
from services.cadastrar_questao_service import CadastrarQuestaoService
from services.listar_questoes_service import ListarQuestoesService
from services.buscar_questao_por_id_service import BuscarQuestaoPorIdService
from services.atualizar_questao_service import AtualizarQuestaoService
from services.excluir_questao_service import ExcluirQuestaoService
from services.buscar_questoes_service import BuscarQuestoesService

questao_bp = Blueprint('questoes', __name__)

class QuestaoController:
    @staticmethod
    def listar():
        termo = (request.args.get('busca') or '').strip()
        materia = (request.args.get('materia') or '').strip()
        if termo or materia:
            resultado = BuscarQuestoesService().execute(termo, materia)
        else:
            resultado = ListarQuestoesService().execute()
        return jsonify(resultado), 200

    @staticmethod
    def buscar(id):
        resultado = BuscarQuestaoPorIdService().execute(id)
        return (jsonify(resultado), 200) if resultado else (jsonify({'erro': 'Questão não encontrada.'}), 404)

    @staticmethod
    def criar():
        try:
            return jsonify(CadastrarQuestaoService().execute(request.get_json(silent=True) or {})), 201
        except ValueError as erro:
            return jsonify({'erro': str(erro)}), 400

    @staticmethod
    def atualizar(id):
        try:
            resultado = AtualizarQuestaoService().execute(id, request.get_json(silent=True) or {})
            return (jsonify(resultado), 200) if resultado else (jsonify({'erro': 'Questão não encontrada.'}), 404)
        except ValueError as erro:
            return jsonify({'erro': str(erro)}), 400

    @staticmethod
    def excluir(id):
        sucesso = ExcluirQuestaoService().execute(id)
        return (jsonify({'mensagem': 'Questão excluída com sucesso.'}), 200) if sucesso else (jsonify({'erro': 'Questão não encontrada.'}), 404)

questao_bp.add_url_rule('/questoes', view_func=QuestaoController.listar, methods=['GET'])
questao_bp.add_url_rule('/questoes/<int:id>', view_func=QuestaoController.buscar, methods=['GET'])
questao_bp.add_url_rule('/questoes', view_func=QuestaoController.criar, methods=['POST'])
questao_bp.add_url_rule('/questoes/<int:id>', view_func=QuestaoController.atualizar, methods=['PUT'])
questao_bp.add_url_rule('/questoes/<int:id>', view_func=QuestaoController.excluir, methods=['DELETE'])

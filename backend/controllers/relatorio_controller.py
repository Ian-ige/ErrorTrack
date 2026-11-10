from flask import Blueprint, jsonify, request
from services.listar_erros_service import ListarErrosService
from services.resumo_desempenho_service import ResumoDesempenhoService

relatorio_bp = Blueprint('relatorios', __name__)

class RelatorioController:
    @staticmethod
    def erros():
        try:
            aluno_id = request.args.get('aluno_id')
            return jsonify(ListarErrosService().execute(aluno_id)), 200
        except ValueError as erro:
            return jsonify({'erro': str(erro)}), 400

    @staticmethod
    def desempenho():
        try:
            aluno_id = request.args.get('aluno_id')
            return jsonify(ResumoDesempenhoService().execute(aluno_id)), 200
        except ValueError as erro:
            return jsonify({'erro': str(erro)}), 400

relatorio_bp.add_url_rule('/relatorios/erros', view_func=RelatorioController.erros, methods=['GET'])
relatorio_bp.add_url_rule('/relatorios/desempenho', view_func=RelatorioController.desempenho, methods=['GET'])

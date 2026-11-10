from flask import Blueprint, jsonify, request
from services.registrar_resposta_service import RegistrarRespostaService
from services.listar_respostas_service import ListarRespostasService

resposta_bp = Blueprint('respostas', __name__)

class RespostaController:
    @staticmethod
    def listar():
        try:
            aluno_id = request.args.get('aluno_id')
            return jsonify(ListarRespostasService().execute(aluno_id)), 200
        except ValueError as erro:
            return jsonify({'erro': str(erro)}), 400

    @staticmethod
    def registrar():
        try:
            return jsonify(RegistrarRespostaService().execute(request.get_json(silent=True) or {})), 201
        except ValueError as erro:
            return jsonify({'erro': str(erro)}), 400

resposta_bp.add_url_rule('/respostas', view_func=RespostaController.listar, methods=['GET'])
resposta_bp.add_url_rule('/respostas', view_func=RespostaController.registrar, methods=['POST'])

from flask import Blueprint, jsonify, request
from services.cadastrar_aluno_service import CadastrarAlunoService
from services.listar_alunos_service import ListarAlunosService
from services.buscar_aluno_por_id_service import BuscarAlunoPorIdService
from services.atualizar_aluno_service import AtualizarAlunoService
from services.excluir_aluno_service import ExcluirAlunoService
from services.buscar_alunos_por_nome_service import BuscarAlunosPorNomeService

aluno_bp = Blueprint('alunos', __name__)

class AlunoController:
    @staticmethod
    def listar():
        nome = (request.args.get('nome') or '').strip()
        resultado = BuscarAlunosPorNomeService().execute(nome) if nome else ListarAlunosService().execute()
        return jsonify(resultado), 200

    @staticmethod
    def buscar(id):
        resultado = BuscarAlunoPorIdService().execute(id)
        return (jsonify(resultado), 200) if resultado else (jsonify({'erro': 'Aluno não encontrado.'}), 404)

    @staticmethod
    def criar():
        try:
            dados = request.get_json(silent=True) or {}
            return jsonify(CadastrarAlunoService().execute(dados)), 201
        except ValueError as erro:
            return jsonify({'erro': str(erro)}), 400

    @staticmethod
    def atualizar(id):
        try:
            resultado = AtualizarAlunoService().execute(id, request.get_json(silent=True) or {})
            return (jsonify(resultado), 200) if resultado else (jsonify({'erro': 'Aluno não encontrado.'}), 404)
        except ValueError as erro:
            return jsonify({'erro': str(erro)}), 400

    @staticmethod
    def excluir(id):
        sucesso = ExcluirAlunoService().execute(id)
        return (jsonify({'mensagem': 'Aluno excluído com sucesso.'}), 200) if sucesso else (jsonify({'erro': 'Aluno não encontrado.'}), 404)

aluno_bp.add_url_rule('/alunos', view_func=AlunoController.listar, methods=['GET'])
aluno_bp.add_url_rule('/alunos/<int:id>', view_func=AlunoController.buscar, methods=['GET'])
aluno_bp.add_url_rule('/alunos', view_func=AlunoController.criar, methods=['POST'])
aluno_bp.add_url_rule('/alunos/<int:id>', view_func=AlunoController.atualizar, methods=['PUT'])
aluno_bp.add_url_rule('/alunos/<int:id>', view_func=AlunoController.excluir, methods=['DELETE'])

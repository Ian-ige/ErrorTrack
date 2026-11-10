from controllers.aluno_controller import aluno_bp
from controllers.questao_controller import questao_bp
from controllers.resposta_controller import resposta_bp
from controllers.relatorio_controller import relatorio_bp

def register_routes(app):
    app.register_blueprint(aluno_bp)
    app.register_blueprint(questao_bp)
    app.register_blueprint(resposta_bp)
    app.register_blueprint(relatorio_bp)

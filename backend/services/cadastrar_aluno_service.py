from models.aluno import Aluno
class CadastrarAlunoService:
    def execute(self, dados):
        nome = (dados.get('name') or '').strip()
        materia = (dados.get('materia') or '').strip()
        if not nome or not materia:
            raise ValueError("Nome e matéria são obrigatórios.")
        return Aluno(name=nome, materia=materia).salvar().to_dict()

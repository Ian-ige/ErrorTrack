from models.aluno import Aluno
class AtualizarAlunoService:
    def execute(self, aluno_id, dados):
        aluno = Aluno.buscar_por_id(aluno_id)
        if not aluno:
            return None
        nome = dados.get('name')
        materia = dados.get('materia')
        if nome is not None and not str(nome).strip():
            raise ValueError("Nome não pode ficar vazio.")
        if materia is not None and not str(materia).strip():
            raise ValueError("Matéria não pode ficar vazia.")
        aluno.atualizar(name=str(nome).strip() if nome is not None else None, materia=str(materia).strip() if materia is not None else None)
        return aluno.to_dict()

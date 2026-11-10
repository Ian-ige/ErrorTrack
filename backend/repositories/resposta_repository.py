from extensions import db
from models.aluno import Aluno
from models.questao import Questao
from models.resposta_aluno import RespostaAluno


class RespostaRepository:
    def listar_por_aluno(self, aluno_id):
        parametro = "?" if db.engine.dialect.paramstyle == "qmark" else "%s"
        sql = f"""
            SELECT
                r.id,
                r.aluno_id,
                r.questao_id,
                r.resposta_marcada,
                r.correta,
                r.respondida_em,
                a.name AS aluno_nome,
                a.materia AS aluno_materia,
                a.created_at AS aluno_created_at,
                q.enunciado,
                q.materia AS questao_materia,
                q.resposta AS questao_resposta,
                q.alternativa_correta,
                q.created_at AS questao_created_at
            FROM resposta_aluno AS r
            INNER JOIN aluno AS a ON a.id = r.aluno_id
            INNER JOIN questao AS q ON q.id = r.questao_id
            WHERE r.aluno_id = {parametro}
            ORDER BY r.respondida_em DESC
        """

        conexao = db.engine.connect()
        try:
            resultado = conexao.exec_driver_sql(sql, (aluno_id,))
            respostas = []

            for linha in resultado.mappings():
                aluno = Aluno(
                    id=linha["aluno_id"],
                    name=linha["aluno_nome"],
                    materia=linha["aluno_materia"],
                    created_at=linha["aluno_created_at"]
                )
                questao = Questao(
                    id=linha["questao_id"],
                    enunciado=linha["enunciado"],
                    materia=linha["questao_materia"],
                    resposta=linha["questao_resposta"],
                    alternativa_correta=linha["alternativa_correta"],
                    created_at=linha["questao_created_at"]
                )
                resposta = RespostaAluno(
                    id=linha["id"],
                    aluno_id=linha["aluno_id"],
                    questao_id=linha["questao_id"],
                    resposta_marcada=linha["resposta_marcada"],
                    correta=linha["correta"],
                    respondida_em=linha["respondida_em"]
                )
                resposta.aluno = aluno
                resposta.questao = questao
                respostas.append(resposta)

            return respostas
        finally:
            conexao.close()

from extensions import db
from models.questao import Questao
from models.aluno import Aluno
from models.resposta_aluno import RespostaAluno


class QuestaoRepository:
    def buscar_com_filtros(self, termo=None, materia=None):
        parametro = "?" if db.engine.dialect.paramstyle == "qmark" else "%s"
        condicoes = []
        parametros = []

        if termo:
            condicoes.append(f"LOWER(enunciado) LIKE LOWER({parametro})")
            parametros.append(f"%{termo}%")

        if materia:
            condicoes.append(f"LOWER(materia) LIKE LOWER({parametro})")
            parametros.append(f"%{materia}%")

        sql = """
            SELECT id, enunciado, materia, resposta,
                   alternativa_correta, created_at
            FROM questao
        """

        if condicoes:
            sql += " WHERE " + " AND ".join(condicoes)

        sql += " ORDER BY id DESC"

        conexao = db.engine.connect()
        try:
            resultado = conexao.exec_driver_sql(sql, tuple(parametros))
            return [
                Questao(
                    id=linha["id"],
                    enunciado=linha["enunciado"],
                    materia=linha["materia"],
                    resposta=linha["resposta"],
                    alternativa_correta=linha["alternativa_correta"],
                    created_at=linha["created_at"]
                )
                for linha in resultado.mappings()
            ]
        finally:
            conexao.close()

    def gerar_relatorio_erros(self, aluno_id=None):
        parametro = "?" if db.engine.dialect.paramstyle == "qmark" else "%s"
        sql = """
            SELECT
                r.id,
                r.aluno_id,
                a.name AS aluno_nome,
                r.questao_id,
                q.enunciado,
                q.materia,
                r.resposta_marcada,
                q.alternativa_correta,
                r.correta,
                r.respondida_em
            FROM resposta_aluno AS r
            INNER JOIN aluno AS a ON a.id = r.aluno_id
            INNER JOIN questao AS q ON q.id = r.questao_id
            WHERE r.correta = 0
        """
        parametros = []

        if aluno_id is not None:
            sql += f" AND r.aluno_id = {parametro}"
            parametros.append(aluno_id)

        sql += " ORDER BY r.respondida_em DESC"

        conexao = db.engine.connect()
        try:
            resultado = conexao.exec_driver_sql(sql, tuple(parametros))
            return [dict(linha) for linha in resultado.mappings()]
        finally:
            conexao.close()

    def resumo_desempenho(self, aluno_id=None):
        parametro = "?" if db.engine.dialect.paramstyle == "qmark" else "%s"
        sql = """
            SELECT
                COUNT(id) AS total_respostas,
                SUM(CASE WHEN correta = 1 THEN 1 ELSE 0 END) AS acertos,
                SUM(CASE WHEN correta = 0 THEN 1 ELSE 0 END) AS erros
            FROM resposta_aluno
        """
        parametros = []

        if aluno_id is not None:
            sql += f" WHERE aluno_id = {parametro}"
            parametros.append(aluno_id)

        conexao = db.engine.connect()
        try:
            linha = conexao.exec_driver_sql(sql, tuple(parametros)).mappings().one()
            total = linha["total_respostas"] or 0
            corretas = int(linha["acertos"] or 0)
            erros = int(linha["erros"] or 0)

            return {
                "total_respostas": total,
                "acertos": corretas,
                "erros": erros,
                "percentual_acerto": round(corretas * 100 / total, 1) if total else 0
            }
        finally:
            conexao.close()

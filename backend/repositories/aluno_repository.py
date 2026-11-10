from extensions import db
from models.aluno import Aluno


class AlunoRepository:
    def buscar_por_nome(self, nome):
        conexao = db.engine.connect()
        try:
            parametro = "?" if db.engine.dialect.paramstyle == "qmark" else "%s"
            sql = f"""
                SELECT id, name, materia, created_at
                FROM aluno
                WHERE LOWER(name) LIKE LOWER({parametro})
                ORDER BY name ASC
            """
            resultado = conexao.exec_driver_sql(sql, (f"%{nome}%",))
            return [
                Aluno(
                    id=linha["id"],
                    name=linha["name"],
                    materia=linha["materia"],
                    created_at=linha["created_at"]
                )
                for linha in resultado.mappings()
            ]
        finally:
            conexao.close()

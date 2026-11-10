from datetime import datetime
from extensions import db

class Questao(db.Model):
    __tablename__ = 'questao'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    enunciado = db.Column(db.Text, nullable=False)
    materia = db.Column(db.String(255), nullable=False)
    resposta = db.Column(db.Text, nullable=True)
    alternativa_correta = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    respostas_alunos = db.relationship('RespostaAluno', back_populates='questao', cascade='all, delete-orphan')

    def salvar(self):
        db.session.add(self)
        db.session.commit()
        return self

    def atualizar(self, **dados):
        for campo in ('enunciado', 'materia', 'resposta', 'alternativa_correta'):
            if campo in dados and dados[campo] is not None:
                setattr(self, campo, dados[campo])
        db.session.commit()
        return self

    def deletar(self):
        db.session.delete(self)
        db.session.commit()

    @classmethod
    def listar_todas(cls):
        return cls.query.order_by(cls.id.desc()).all()

    @classmethod
    def buscar_por_id(cls, id_questao):
        return db.session.get(cls, id_questao)

    def to_dict(self):
        return {
            'id': self.id,
            'enunciado': self.enunciado,
            'materia': self.materia,
            'resposta': self.resposta,
            'alternativa_correta': self.alternativa_correta,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

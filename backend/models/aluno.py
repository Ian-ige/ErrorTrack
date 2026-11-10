from datetime import datetime
from extensions import db

class Aluno(db.Model):
    __tablename__ = 'aluno'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    materia = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    respostas = db.relationship('RespostaAluno', back_populates='aluno', cascade='all, delete-orphan')

    def salvar(self):
        db.session.add(self)
        db.session.commit()
        return self

    def atualizar(self, name=None, materia=None):
        if name is not None:
            self.name = name
        if materia is not None:
            self.materia = materia
        db.session.commit()
        return self

    def deletar(self):
        db.session.delete(self)
        db.session.commit()

    @classmethod
    def listar_todos(cls):
        return cls.query.order_by(cls.id.desc()).all()

    @classmethod
    def buscar_por_id(cls, id_aluno):
        return db.session.get(cls, id_aluno)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'materia': self.materia,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

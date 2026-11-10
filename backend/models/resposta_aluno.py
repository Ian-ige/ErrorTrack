from datetime import datetime
from extensions import db

class RespostaAluno(db.Model):
    __tablename__ = 'resposta_aluno'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    aluno_id = db.Column(db.Integer, db.ForeignKey('aluno.id', ondelete='CASCADE'), nullable=False)
    questao_id = db.Column(db.Integer, db.ForeignKey('questao.id', ondelete='CASCADE'), nullable=False)
    resposta_marcada = db.Column(db.String(255), nullable=False)
    correta = db.Column(db.Boolean, nullable=False)
    respondida_em = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    aluno = db.relationship('Aluno', back_populates='respostas')
    questao = db.relationship('Questao', back_populates='respostas_alunos')

    def salvar(self):
        db.session.add(self)
        db.session.commit()
        return self

    @classmethod
    def listar_todos(cls):
        return cls.query.order_by(cls.respondida_em.desc()).all()

    @classmethod
    def buscar_por_id(cls, resposta_id):
        return db.session.get(cls, resposta_id)

    def deletar(self):
        db.session.delete(self)
        db.session.commit()

    def to_dict(self):
        return {
            'id': self.id,
            'aluno_id': self.aluno_id,
            'aluno_nome': self.aluno.name if self.aluno else None,
            'questao_id': self.questao_id,
            'enunciado': self.questao.enunciado if self.questao else None,
            'materia': self.questao.materia if self.questao else None,
            'resposta_marcada': self.resposta_marcada,
            'alternativa_correta': self.questao.alternativa_correta if self.questao else None,
            'correta': self.correta,
            'respondida_em': self.respondida_em.isoformat() if self.respondida_em else None
        }

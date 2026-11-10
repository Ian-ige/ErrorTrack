import os
import sys
from flask import Flask
from flask_cors import CORS
from extensions import db
from routes import register_routes

root_dir = os.path.abspath(os.path.dirname(__file__))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

frontend_dir = os.path.abspath(os.path.join(root_dir, '..', 'frontend'))
os.makedirs(os.path.join(root_dir, 'instance'), exist_ok=True)
app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///errortrack.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_SORT_KEYS'] = False

db.init_app(app)
CORS(app)

from models.aluno import Aluno
from models.questao import Questao
from models.resposta_aluno import RespostaAluno

register_routes(app)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true')

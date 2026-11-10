from extensions import db

def get_db_connection():
    return db.engine.connect()

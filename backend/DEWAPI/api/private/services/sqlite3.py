import sqlite3
from flask import g

DATABASE = 'db/database.db'


def connect_db():
    return sqlite3.connect(DATABASE)


# @api.before_request
def before_request():
    g.db = connect_db()


# @api.teardown_request
def teardown_request(exception):
    if hasattr(g, 'db'):
        g.db.close()


def query_many(query, args=(), one=False):
    g.db = connect_db()
    cur = g.db.executemany(query, args)
    g.db.commit()
    rv = [dict((cur.description[idx][0], value) for idx, value in enumerate(row)) for row in cur.fetchall()]
    teardown_request(None)
    return (rv[0] if rv else None) if one else rv

def query_db(query, args=(), one=False):
    # g.db = connect_db()

    g.db = connect_db()
    cur = g.db.execute(query, args)
    rv = [dict((cur.description[idx][0], value) for idx, value in enumerate(row)) for row in cur.fetchall()]
    teardown_request(None)
    return (rv[0] if rv else None) if one else rv


def update_experiment(experiment="",userId="",experimentId="",name="",description=""):
    query = "update experiment set content = ? ,updated_at = datetime(),name=?,description=?  where uid = ? and experiment_id = ?"
    query_many(query, [(experiment,name,description,userId,experimentId)])
    print(query)
    return True, "Successful"

def find_experiment(userId):
    query = "select experiment_id,name,description,created_at created_date,updated_at as updated_date from experiment where uid = ?"
    return query_db(query, (userId,))


def getExperimentById(userId,id1):
    query = "select name,description,content as experiment from experiment where uid = ? and experiment_id = ?"
    return query_db(query, (userId,id1),one=True)
def create_experiment(experiment="",uid=""):
    query = "insert into experiment(experiment, uid) values(?,?)"
    query_many(query,[(experiment,uid)])
    return True

def create_or_update_experiment(experiment="", username=""):
    previous_experiment = find_experiment(username)
    if previous_experiment is None:
        create_experiment(experiment=experiment, username=username)
    else:
        update_experiment(experiment=experiment, username=username)
    return True

def create_experiment_table():
    query = "create table IF NOT EXISTS experiment(uid varchar(255) primary key, experiment text)"
    g.db = connect_db()
    cur = g.db.execute(query)
    g.db.commit()
    teardown_request(None)


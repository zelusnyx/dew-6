from app import app, db

# with app.app_context():
#     db.create_all()

PORT=8800
HOST='0.0.0.0'
app.run(host=HOST, port=PORT, debug=True)
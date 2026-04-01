from dataclasses import asdict

from flask import Flask, jsonify, request
from flask_cors import CORS

from password_checker import PasswordEvaluator


app = Flask(__name__)
CORS(app)
evaluator = PasswordEvaluator()


@app.get("/api/health")
def health() -> tuple:
    return jsonify({"status": "ok"}), 200


@app.post("/api/evaluate")
def evaluate() -> tuple:
    payload = request.get_json(silent=True) or {}
    password = payload.get("password", "")

    result = evaluator.evaluate(password)
    return jsonify(asdict(result)), 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)

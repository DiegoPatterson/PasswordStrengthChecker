# PasswordStrengthChecker
For Secure System Principals Midterm 

## Python Core Functionality

This project now includes a Python password analysis engine aligned with modern NIST-style principles:

- Prioritizes length and entropy over legacy composition-only rules.
- Detects common password and dictionary-based weaknesses.
- Detects predictable patterns like sequences, keyboard walks, repetition, and leetspeak substitutions.
- Returns an objective score, entropy estimate, rating, and actionable feedback.

## Run Locally

### Install Dependencies

```bash
# Backend (from project root)
c:/Users/diego/PasswordStrengthChecker/.venv/Scripts/python.exe -m pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Interactive CLI

```bash
python main.py
```

### Website (React + Flask API)

Start the backend API in one terminal:

```bash
cd /c/Users/diego/PasswordStrengthChecker
c:/Users/diego/PasswordStrengthChecker/.venv/Scripts/python.exe api.py
```

Start the React frontend in a second terminal:

```bash
cd /c/Users/diego/PasswordStrengthChecker/frontend
npm run dev
```

Then open the Vite URL shown in terminal (usually `http://localhost:5173`).

If the frontend cannot reach the API, create `frontend/.env` with:

```bash
VITE_API_BASE_URL=http://127.0.0.1:5000
```

Then restart `npm run dev`.

### Unit Tests

```bash
python -m unittest discover -s tests -v
```

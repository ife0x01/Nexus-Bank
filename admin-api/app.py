"""
Nexus Bank — Internal Admin API (Python/Flask)
FLAG13: JWT algorithm confusion (alg:none)
FLAG14: Chained IDOR → password reset → account takeover
"""
import os, jwt, json, base64, psycopg2, psycopg2.extras
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

DB_URL     = os.environ.get("DATABASE_URL", "postgresql://ctf:ctfpassword@postgres:5432/vaultcorp")
JWT_SECRET = os.environ.get("JWT_SECRET", "ctf_hard_to_guess_secret_2024")

def db():
    return psycopg2.connect(DB_URL, cursor_factory=psycopg2.extras.RealDictCursor)

def b64d(s):
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)

def decode_vulnerable(token):
    parts = token.split(".")
    if len(parts) not in (2, 3): raise ValueError("Invalid token")
    header  = json.loads(b64d(parts[0]))
    payload = json.loads(b64d(parts[1]))
    alg = header.get("alg", "").lower()
    if alg == "none": return payload          # VULNERABLE: no signature check
    if alg in ("hs256", "hs384", "hs512"):
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256","HS384","HS512"])
    raise ValueError(f"Unsupported algorithm: {alg}")

@app.route("/")
def index():
    return jsonify({"service": "Nexus Bank Internal Admin API", "version": "1.0", "status": "operational"})

# FLAG13 — JWT alg:none
@app.route("/internal/risk-report")
def risk_report():
    """Requires admin JWT — but accepts alg:none"""
    auth = request.headers.get("Authorization","")
    if not auth.startswith("Bearer "): return jsonify({"error": "Authorization required"}), 401
    try:
        payload = decode_vulnerable(auth[7:])
    except Exception as e:
        return jsonify({"error": "Token rejected", "detail": str(e)}), 401
    if payload.get("role") != "admin":
        return jsonify({"error": "Admin access required", "your_role": payload.get("role")}), 403
    return jsonify({
        "report": "Q4 Risk Assessment — Nexus Bank Internal",
        "high_risk_accounts": 2,
        "fraud_alerts": 5,
        "compliance_ref": "CTF{flag13_jwt_alg_none_bypass}",
        "generated": "2024-12-31"
    })

# FLAG14 — final step of the chain
# Chain: IDOR GET /api/accounts/3 → sarah's email → forgot-password → reset_token in response
#        → reset sarah's password → login as sarah → GET /internal/account-takeover
@app.route("/internal/account-takeover")
def account_takeover():
    """Final flag — must be authenticated as sarah.jones"""
    auth_header = request.headers.get("Authorization","")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Authorization required"}), 401
    try:
        payload = jwt.decode(auth_header[7:], JWT_SECRET, algorithms=["HS256"])
    except jwt.InvalidTokenError as e:
        return jsonify({"error": "Invalid token", "detail": str(e)}), 401

    if payload.get("email") != "sarah.jones@gmail.com":
        return jsonify({
            "error": "This endpoint requires you to be authenticated as a specific account",
            "hint": "Complete the full chain: find the target account, reset the password, log in."
        }), 403

    conn = db(); cur = conn.cursor()
    cur.execute("SELECT full_name, email FROM users WHERE email = 'sarah.jones@gmail.com'")
    sarah = cur.fetchone(); conn.close()

    return jsonify({
        "message": "Account takeover successful",
        "victim": dict(sarah),
        "account_balance": "$89,230.00",
        "compliance_ref": "CTF{flag14_chained_idor_account_takeover}",
        "chain": [
            "1. GET /api/accounts/3 — IDOR leaks sarah's email",
            "2. POST /api/auth/forgot-password — reset_token returned in response",
            "3. POST /api/auth/reset-password — change sarah's password",
            "4. POST /api/auth/login — authenticate as sarah",
            "5. GET /internal/account-takeover — claim the flag"
        ]
    })

@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "nexusbank-admin-api"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    print(f"[Nexus Bank Admin API] :{port}")
    app.run(host="0.0.0.0", port=port, debug=False)

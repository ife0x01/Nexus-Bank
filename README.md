# 🏦 Nexus Bank — Pentest Lab

A realistic digital banking application with 15 embedded vulnerabilities across BAC, IDOR, JWT attacks, chained exploits, and race conditions.

**No hints in the UI. Find vulnerabilities through API exploration, Burp Suite, and dev tools — exactly like a real pentest.**

---

## Quick Start

```bash
docker compose up --build
```

| Service       | URL                       |
|---------------|---------------------------|
| Banking App   | http://localhost:3000     |
| Main API      | http://localhost:8000     |
| Admin API     | http://localhost:8001     |
| Scoreboard    | http://localhost:4000     |

---

## Accounts

| Email                      | Password       | Role     |
|----------------------------|----------------|----------|
| john.smith@gmail.com       | Banking@123    | customer |
| sarah.jones@gmail.com      | Banking@456    | customer |
| mike.chen@gmail.com        | Banking@789    | customer |
| emma.wilson@gmail.com      | Banking@321    | customer |
| admin@nexusbank.com        | AdminNexus@1   | admin    |

Start as **john** — he has accounts 1 & 2 and `upgrade_eligible=true`.

---

## Scoreboard API

```bash
# List all flags (no solutions)
curl http://localhost:4000/flags

# Submit a flag
curl -X POST http://localhost:4000/submit \
  -H "Content-Type: application/json" \
  -d '{"flag":"CTF{...}","session":"myteam"}'

# Check progress
curl http://localhost:4000/progress/myteam

# Get a hint for flag N
curl http://localhost:4000/hints/8
```

---

## Vulnerability Map

| # | Type | Endpoint | Difficulty |
|---|------|----------|-----------|
| 01 | IDOR — sequential | GET /api/accounts/:id | Easy |
| 02 | BAC horizontal | GET /api/accounts/summary?accountId= | Easy |
| 03 | BAC vertical — no auth | GET /api/admin/customers | Easy |
| 04 | IDOR — statement download | GET /api/statements/:id | Intermediate |
| 05 | BAC horizontal — password | PUT /api/profile/password/:userId | Intermediate |
| 06 | JWT role tamper | GET /api/admin/overview | Intermediate |
| 07 | Mass assignment | PUT /api/profile {userId:5} | Intermediate |
| 08 | GUID IDOR | GET /api/transactions/receipt/:uuid | Advanced |
| 09 | Forced browsing | GET /api/v1/internal/export | Advanced |
| 10 | Weak JWT secret | GET /api/admin/audit-log | Advanced |
| 11 | MD5 indirect ref | GET /api/statements/ref/:hash | Advanced |
| 12 | CORS null origin | GET /api/admin/pii | Advanced |
| 13 | JWT alg:none | GET :8001/internal/risk-report | Advanced |
| 14 | Chained attack | :8001/internal/account-takeover | Advanced |
| 15 | Race condition | POST /api/transactions/transfer | Advanced |

---

## Reset

```bash
docker compose down -v && docker compose up --build
```

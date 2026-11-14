-- Nexus Bank — Database Seed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  uuid          UUID DEFAULT gen_random_uuid() UNIQUE,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) DEFAULT 'customer',
  address       TEXT,
  dob           DATE,
  kyc_status    VARCHAR(20) DEFAULT 'verified',
  reset_token   VARCHAR(100),
  upgrade_eligible BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW()
);

INSERT INTO users (full_name, email, phone, password_hash, role, address, dob, upgrade_eligible) VALUES
  ('John Smith',    'john.smith@gmail.com',    '+1-415-555-0101', '$2b$10$eddFW7Faf9MDMokkYtLM8uzOd44/hyNohAQFr2t255ffBTCow1Q5a', 'customer', '742 Evergreen Terrace, Springfield IL 62701', '1990-03-15', true),
  ('Sarah Jones',   'sarah.jones@gmail.com',   '+1-212-555-0192', '$2b$10$KKyp86omupe4CJUF63bTKOF3PSb0IhavjHoPrhQSt6P7SJtUu8aA2', 'customer', '1600 Pennsylvania Ave, Washington DC 20500', '1988-07-22', false),
  ('Mike Chen',     'mike.chen@gmail.com',     '+1-650-555-0147', '$2b$10$KTVTDhWKc8D3MdyYK3f4vedEVHbg9JKLfH9CpUy8ta4x1VPahvlDq', 'customer', '1 Infinite Loop, Cupertino CA 95014',         '1985-11-08', false),
  ('Emma Wilson',   'emma.wilson@gmail.com',   '+1-312-555-0163', '$2b$10$ea9LSbv/yLCXEzVOOGOKA.fOSapWxHEJizdZNhWxkYqp6wY84N9PK', 'customer', '233 S Wacker Dr, Chicago IL 60606',           '1995-02-28', false),
  ('Admin User',    'admin@nexusbank.com',      '+1-800-555-0001', '$2b$10$/hLfk6XP9F6mGFZU/9RlFe9U/0EhGCJDl4qx0Z0cU6.AueuF7GHJe', 'admin',    '350 Fifth Ave, New York NY 10118',            '1980-01-01', false);

-- ─── Accounts ────────────────────────────────────────────────────────────────
CREATE TABLE accounts (
  id             SERIAL PRIMARY KEY,
  uuid           UUID DEFAULT gen_random_uuid() UNIQUE,
  user_id        INTEGER REFERENCES users(id),
  account_number VARCHAR(20) UNIQUE NOT NULL,
  routing_number VARCHAR(9) DEFAULT '021000021',
  account_type   VARCHAR(20) NOT NULL,
  balance        DECIMAL(12,2) DEFAULT 0.00,
  currency       VARCHAR(3) DEFAULT 'USD',
  status         VARCHAR(20) DEFAULT 'active',
  internal_ref   TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);

INSERT INTO accounts (user_id, account_number, account_type, balance, internal_ref) VALUES
  (1, '4820-1004-2891', 'checking', 12450.50,   NULL),
  (1, '4820-1004-2892', 'savings',  45230.00,   NULL),
  (2, '4820-2008-7341', 'checking', 89230.00,   'COMPLIANCE-REF: CTF{flag01_account_idor_sequential}'),
  (2, '4820-2008-7342', 'savings',  312500.00,  NULL),
  (3, '4820-3004-5612', 'checking', 234560.75,  NULL),
  (3, '4820-3004-5613', 'savings',  567890.00,  NULL),
  (4, '4820-4002-3841', 'checking', 3200.00,    NULL),
  (5, '4820-5000-1000', 'internal', 0.00,       NULL);

-- ─── Cards ───────────────────────────────────────────────────────────────────
CREATE TABLE cards (
  id           SERIAL PRIMARY KEY,
  account_id   INTEGER REFERENCES accounts(id),
  last_four    VARCHAR(4),
  card_type    VARCHAR(20),
  network      VARCHAR(20) DEFAULT 'Visa',
  expiry       VARCHAR(7),
  status       VARCHAR(20) DEFAULT 'active',
  created_at   TIMESTAMP DEFAULT NOW()
);

INSERT INTO cards (account_id, last_four, card_type, network, expiry) VALUES
  (1, '4231', 'debit',  'Visa',       '08/27'),
  (2, '8812', 'debit',  'Visa',       '08/27'),
  (3, '7741', 'credit', 'Mastercard', '11/26'),
  (4, '3390', 'credit', 'Mastercard', '11/26'),
  (5, '9982', 'debit',  'Visa',       '03/28'),
  (6, '1153', 'credit', 'Amex',       '03/28'),
  (7, '5527', 'debit',  'Visa',       '06/27');

-- ─── Transactions ─────────────────────────────────────────────────────────────
CREATE TABLE transactions (
  id            SERIAL PRIMARY KEY,
  uuid          UUID DEFAULT gen_random_uuid() UNIQUE,
  account_id    INTEGER REFERENCES accounts(id),
  amount        DECIMAL(12,2),
  type          VARCHAR(20),
  merchant      VARCHAR(100),
  category      VARCHAR(50),
  description   TEXT,
  internal_note TEXT,
  status        VARCHAR(20) DEFAULT 'completed',
  created_at    TIMESTAMP DEFAULT NOW()
);

-- John's transactions (account 1 - checking)
INSERT INTO transactions (account_id, amount, type, merchant, category, description, created_at) VALUES
  (1,  3250.00, 'credit', 'Employer Direct Deposit', 'income',       'Payroll ACH — Acme Corp',          NOW() - INTERVAL '14 days'),
  (1,  -89.99,  'debit',  'Amazon.com',              'shopping',     'Order #114-8823771-9234102',        NOW() - INTERVAL '13 days'),
  (1,  -6.45,   'debit',  'Starbucks #4291',         'food',         'Mobile order',                     NOW() - INTERVAL '12 days'),
  (1,  -67.80,  'debit',  'Shell Gas Station',       'transport',    'Fuel purchase',                    NOW() - INTERVAL '11 days'),
  (1,  -15.99,  'debit',  'Netflix',                 'entertainment','Monthly subscription',             NOW() - INTERVAL '10 days'),
  (1,  3250.00, 'credit', 'Employer Direct Deposit', 'income',       'Payroll ACH — Acme Corp',          NOW() - INTERVAL '7 days'),
  (1,  -156.23, 'debit',  'Target',                  'shopping',     'In-store purchase',                NOW() - INTERVAL '6 days'),
  (1,  -89.00,  'debit',  'AT&T',                    'utilities',    'Monthly phone bill',               NOW() - INTERVAL '5 days'),
  (1,  -24.50,  'debit',  'Uber',                    'transport',    'Ride to SFO',                      NOW() - INTERVAL '4 days'),
  (1,   150.00, 'credit', 'Zelle Transfer',          'transfer',     'From: Sarah Jones',                NOW() - INTERVAL '3 days'),
  (1,  -234.56, 'debit',  'Whole Foods Market',      'groceries',    'Weekly groceries',                 NOW() - INTERVAL '2 days'),
  (1,  -12.99,  'debit',  'Spotify',                 'entertainment','Monthly subscription',             NOW() - INTERVAL '1 day');

-- Sarah's transactions (account 3 - checking) — one has a FLAG in internal_note
INSERT INTO transactions (account_id, amount, type, merchant, category, description, internal_note, created_at) VALUES
  (3,  8500.00, 'credit', 'Wire Transfer Inbound',   'transfer',     'Wire from Morgan Stanley',         NULL,                                              NOW() - INTERVAL '15 days'),
  (3,  -1299.00,'debit',  'Apple Store',             'shopping',     'MacBook Pro 14"',                  NULL,                                              NOW() - INTERVAL '14 days'),
  (3,  -234.56, 'debit',  'Whole Foods Market',      'groceries',    'Grocery run',                      NULL,                                              NOW() - INTERVAL '12 days'),
  (3,  -3200.00,'debit',  'Internal Wire',           'transfer',     'Wire ref 2024-NXB-00441',          'AUDIT-LOG: CTF{flag08_transaction_uuid_idor}',    NOW() - INTERVAL '10 days'),
  (3,   2500.00,'credit', 'Dividend Payment',        'income',       'Q4 dividend — Vanguard ETF',       NULL,                                              NOW() - INTERVAL '8 days'),
  (3,  -890.00, 'debit',  'Marriott Hotels',         'travel',       'Booking #MRR-9923847',             NULL,                                              NOW() - INTERVAL '5 days'),
  (3,  -67.30,  'debit',  'Starbucks Reserve',       'food',         'Catering order',                   NULL,                                              NOW() - INTERVAL '2 days');

-- Mike's transactions (account 5 - checking)
INSERT INTO transactions (account_id, amount, type, merchant, category, description, created_at) VALUES
  (5, 12500.00, 'credit', 'Consulting Invoice',      'income',       'Invoice #INV-2024-089 — TechCorp', NOW() - INTERVAL '20 days'),
  (5, -4500.00, 'debit',  'Schwab Investment',       'investment',   'Stock purchase NVDA',              NOW() - INTERVAL '18 days'),
  (5, -2890.00, 'debit',  'Airbnb',                  'travel',       'Tokyo listing — 7 nights',         NOW() - INTERVAL '15 days'),
  (5,  -445.00, 'debit',  'United Airlines',         'travel',       'SFO → NRT — 1 pax',                NOW() - INTERVAL '15 days'),
  (5, 15000.00, 'credit', 'Consulting Invoice',      'income',       'Invoice #INV-2024-094 — DataSync', NOW() - INTERVAL '7 days'),
  (5,  -789.00, 'debit',  'Best Buy',                'shopping',     'Electronics purchase',             NOW() - INTERVAL '3 days');

-- ─── Statements ──────────────────────────────────────────────────────────────
CREATE TABLE statements (
  id          SERIAL PRIMARY KEY,
  uuid        UUID DEFAULT gen_random_uuid() UNIQUE,
  account_id  INTEGER REFERENCES accounts(id),
  period      VARCHAR(20),
  summary     TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO statements (account_id, period, summary) VALUES
  (1, '2024-12', 'Opening: $9,842.17 | Credits: $6,500.00 | Debits: $3,891.67 | Closing: $12,450.50'),
  (1, '2024-11', 'Opening: $8,100.00 | Credits: $6,500.00 | Debits: $4,757.83 | Closing: $9,842.17'),
  (3, '2024-12', 'Opening: $83,000.00 | Credits: $11,000.00 | Debits: $4,770.00 | Closing: $89,230.00 | COMPLIANCE: CTF{flag04_statement_idor_no_ownership}'),
  (3, '2024-11', 'Opening: $75,500.00 | Credits: $15,000.00 | Debits: $7,500.00 | Closing: $83,000.00'),
  (5, '2024-12', 'Opening: $212,000.00 | Credits: $27,500.00 | Debits: $4,939.25 | Closing: $234,560.75'),
  (7, '2024-12', 'Opening: $4,100.00 | Credits: $0.00 | Debits: $900.00 | Closing: $3,200.00');

-- ─── Support Tickets ─────────────────────────────────────────────────────────
CREATE TABLE support_tickets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  subject    VARCHAR(255),
  message    TEXT,
  status     VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO support_tickets (user_id, subject, message, status) VALUES
  (1, 'Dispute — Amazon charge', 'I did not authorize the $89.99 charge from Amazon on Jan 10. Please investigate.', 'resolved'),
  (2, 'Wire transfer inquiry',   'Can you confirm my wire transfer on Dec 28 cleared? Ref: 2024-NXB-00441.',          'open'),
  (4, 'Lost debit card',         'I lost my card ending in 5527. Please freeze it and issue a replacement.',          'in_progress');

-- ─── Audit Log (internal) ────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER,
  action     VARCHAR(100),
  ip_address VARCHAR(45),
  details    TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO audit_log (user_id, action, ip_address, details) VALUES
  (5, 'ADMIN_LOGIN',      '10.0.1.4',  'Admin login successful'),
  (5, 'BULK_EXPORT',      '10.0.1.4',  'CTF{flag09_forced_browse_internal_export}'),
  (5, 'CONFIG_UPDATE',    '10.0.1.4',  'KYC threshold updated: $9,999 → $4,999'),
  (2, 'LARGE_TRANSFER',   '98.124.56.201', 'Transfer flagged for review: $3,200.00');

CREATE INDEX idx_accounts_user   ON accounts(user_id);
CREATE INDEX idx_transactions_acc ON transactions(account_id);
CREATE INDEX idx_statements_acc  ON statements(account_id);

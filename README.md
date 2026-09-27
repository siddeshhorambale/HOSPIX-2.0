# HOSPIX - Intelligent B2B Hospitality Resource Exchange Platform

> **"From finding a supplier to fulfilling a requirement."**

HOSPIX is a requirement-first B2B coordination layer connecting **Resource Providers** (hotels, caterers, rental businesses with unused inventory) and **Resource Seekers** (event planners and hospitality businesses needing temporary inventory).

---

## 🌟 Tech Stack & Architecture

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons, Geographic Hub Visualization.
- **Backend:** Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0 Asyncio.
- **Database:** PostgreSQL / SQLite with foreign keys & transactional isolation across 14 relational tables.
- **AI:** Google Gemini API (`POST /ai/parse-requirement`) with robust deterministic regex & NLP fallback parser.
- **Security:** JWT authentication with bcrypt password hashing.

---

## 🏗️ Strict Phase Implementation Overview

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Project setup, DB Schema (14 tables), JWT Authentication (Register/Login/Roles: Provider & Seeker) | ✅ Verified |
| **Phase 2** | Provider Dashboard (Manage catalog, create resources across 5 predefined categories, pricing, calendar availability blocks) | ✅ Verified |
| **Phase 3** | Seeker Dashboard (Natural language AI requirement parser, confirmation & manual edit form) | ✅ Verified |
| **Phase 4** | Matching Engine (Hard filters, weighted ranking: Availability 30%, Quantity 25%, Distance 15%, Price 15%, Compatibility 10%, Trust 5%, "Why this match?" explanation bullets) | ✅ Verified |
| **Phase 5** | Pooling Algorithm (Generates multi-provider combinations when single providers cannot fulfill required quantity, ranked by full coverage, budget, and minimal handoffs) | ✅ Verified |
| **Phase 6** | Bookings State Machine (`PENDING` → `ACCEPTED` / `COUNTER_OFFER` → `CONFIRMED` → `CANCELLED`) | ✅ Verified |
| **Phase 7** | Transactional Availability & Subtraction (Reduces inventory only on confirmation, negative inventory & double-booking prevention with HTTP 409, inventory restoration on cancellation) | ✅ Verified |

---

## 🚀 Quick Start Guide

### 1. Backend

```bash
cd backend
# Activate virtual environment
venv\Scripts\activate
# Start the FastAPI API server
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Root Health Check: `http://localhost:8000/api/health`

### 2. Frontend

```bash
cd frontend
# Start Vite development server
npm run dev
```
- Open in browser: `http://localhost:5173`

---

## 🏢 Mandatory Demo Accounts (Pre-Seeded)

| Account | Email | Password | Role | Hub | Initial Inventory |
|---|---|---|---|---|---|
| **Royal Banquets** | `provider1@royalbanquets.com` | `Password123!` | Provider | Thane | 100 Chairs (₹30/day), 10 Tables (₹200/day) |
| **EventEase Rentals** | `provider2@eventease.com` | `Password123!` | Provider | Mulund | 80 Chairs (₹28/day), 10 Tables (₹220/day) |
| **PartyHub Events** | `provider3@partyhub.com` | `Password123!` | Provider | Bhiwandi | 50 Chairs (₹25/day), 5 Tables (₹200/day) |
| **Grand Caterers** | `provider4@grandcaterers.com` | `Password123!` | Provider | Navi Mumbai | 150 Chairs (₹35/day), 20 Tables (₹250/day) |
| **Apex Event Planners** | `seeker@apexevents.com` | `Password123!` | Seeker | Thane | Wedding & Corporate Event Organizer |

*(You can also use the one-click "Seed Mumbai Data" button in the navigation bar at any time).*

---

## 🧪 Testing the Pooling Engine Demo

1. Sign in as Seeker (`seeker@apexevents.com`).
2. Type or select the sample prompt:
   > *"Need 200 chairs and 20 tables for a wedding in Thane tomorrow, budget 15,000"*
3. Click **Parse Requirement** (AI structures the quantities, date, venue, and budget).
4. Click **Find Matches & Pool Resources**:
   - Single providers (Royal Banquets with 100 chairs, EventEase with 80 chairs) cannot fulfill 200 chairs alone.
   - The engine generates and ranks pooled combinations (e.g., Royal Banquets + Grand Caterers = 250 chairs, or Royal Banquets + EventEase + PartyHub = 230 chairs).
   - "Why this match?" explains full coverage, budget alignment, and logistics distance.
5. Click **Request Pooled Solution** to initiate coordinated booking requests.
6. Sign in as Provider (`provider1@royalbanquets.com`) to accept or propose a counter-offer.
7. Confirm booking to witness live transactional inventory deduction!

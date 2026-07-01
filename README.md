# StageHub – Entertainment Booking Marketplace MVP

StageHub is a premium, availability-first entertainment booking marketplace that connects **venue organizations** (restaurants, hotels, clubs, etc.) with **performers** (bands, DJs, comedians).

Unlike traditional platforms, StageHub focuses exclusively on **calendar availability** (rather than posts or social feeds). Venues create and publish bookable calendar slots, and performers find matches and request reservations through a structured approval workflow.

This MVP is styled with a custom **Airbnb/Stripe-inspired dashboard design system**, supporting custom dark modes, interactive calendar views, direct messaging, notifications, and ratings.

---

## Project Structure

The project is structured as a feature-first monorepo divided into two distinct components:
- `backend/`: Node.js Express API server with in-memory database store and seed data.
- `frontend/`: Next.js web application utilizing Tailwind CSS, TypeScript, and Lucide React.

```
stagehub/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts      # Express App with all REST routes
│       ├── store.ts       # Mock Store database models and seed data
│       └── test.ts        # Business rule validations unit tests
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app/
│       │   ├── page.tsx                    # Airbnb theme landing page
│       │   ├── login/page.tsx              # Role selector login panel
│       │   ├── dashboard/page.tsx          # Session auth redirector
│       │   ├── dashboard/organization/page.tsx # Venues, Calendar slots, Booking approvals
│       │   └── dashboard/performer/page.tsx    # Portfolio editor, Airbnb-style discover page
│       └── lib/
│           └── api.ts      # REST API client configurations
├── docker-compose.yml       # Orchestrates PostgreSQL db, backend, and frontend
├── postman_collection.json  # Postman API Collection
├── openapi.json             # OpenAPI v3.0 Specification
└── README.md
```

---

## Quick Start (Run Locally)

### Option 1: Direct Node.js (Recommended for fast local testing)

Make sure you have Node.js (version 18+) installed.

1. **Start the Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   The backend will boot on `http://localhost:3001`.

2. **Start the Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   The frontend will boot on `http://localhost:3000`. Open it in your browser!

### Option 2: Docker Compose

Ensure Docker and Docker Compose are installed on your machine. Run the following command from the root directory:

```bash
docker-compose up --build
```

This starts three services:
- PostgreSQL Database on `localhost:5432`
- Node.js Express Backend on `localhost:3001`
- Next.js Web App on `localhost:3000`

---

## Verification & Testing

### Running Unit Tests
You can verify the core database-level validation logic (preventing overlapping calendar slots, blocked bookings, and illegal deletes) by running:

```bash
cd backend
npm run test
```

You should see:
```
=== STAGEHUB CORE VALIDATION TESTS ===
✓ [PASSED] Validation prevents overlapping slot timeframes
✓ [PASSED] Validation allows adjacent slots without overlap
...
Status: ALL TESTS PASSED SUCCESSFULLY!
```

---

## Mock Demo Accounts

Since this MVP runs on **mock authentication**, any email and password combination will grant login access. We have pre-configured four high-quality profiles to demo the two core workflows:

1. **ABC Hospitality (Organization / Venue Admin)**
   - **Email:** `org@stagehub.com`
   - **Role selection:** Organization / Venue
   - **Venues managed:** *Sector 17 Brew & Cafe*, *The Downtown Club & Lounge*, and *Metropolitan Resort*

2. **Sarah & Jack (Performer / Acoustic Duo)**
   - **Email:** `perf1@stagehub.com`
   - **Role selection:** Performer / Artist

3. **DJ Electro (Performer / House & Techno)**
   - **Email:** `perf2@stagehub.com`
   - **Role selection:** Performer / Artist

4. **Mike the Comedian (Performer / Stand-up Artist)**
   - **Email:** `perf3@stagehub.com`
   - **Role selection:** Performer / Artist

---

## Interactive End-to-End Walkthrough

To experience the full availability-driven booking workflow:
1. **Login as Performer** using `perf1@stagehub.com` (Acoustic Duo).
2. Go to **Discover Slots**. You'll see the available slots posted by ABC Hospitality.
3. Filter slots by location "Cityville" or select "Café" type. Click **View Details & Apply** on *Sector 17 Brew & Cafe*'s slot.
4. Click **Send Request to Book Slot**. The slot status will change to "Pending" and a booking request is logged.
5. **Sign Out** and **Login as Venue Admin** using `org@stagehub.com`.
6. You will see a new **Booking Request Received** banner in your dashboard notifications!
7. Navigate to the **Messages** tab, select Acoustic Duo, and chat with them regarding setup.
8. Go to **Bookings** or **Calendar**, inspect the request, and click **Approve**.
9. The slot will update to **Booked (Confirmed)**, notifying the artist, and blocking other applications.

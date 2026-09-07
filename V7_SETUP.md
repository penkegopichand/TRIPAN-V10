# TRIPAN V7 — Setup & Test

## 1. Install dependencies
```powershell
npm install
```

## 2. Create `.env`
Copy `.env.example` to `.env` and fill in:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- PORT=3000
- JWT_SECRET

Never commit `.env`.

## 3. Start
```powershell
npm run dev
```

Expected:
`TRIPAN V7 running at http://localhost:3000`

## 4. Test
Open:
- http://localhost:3000/api/health
- http://localhost:3000/api/destinations

Then open:
- http://localhost:3000

The V7 server reads destinations and places from Supabase instead of the old hard-coded destination list.

## 5. Database expectation
`public.destinations` should contain:
- id
- name
- state
- country
- description
- latitude
- longitude
- image_url

`public.places` should contain:
- id
- destination_id
- name
- category
- description
- latitude
- longitude
- entry_fee
- visit_duration
- image_url

The `places.destination_id` values must reference `destinations.id`.

## Important
Do not put a Supabase service-role/secret key in frontend code or GitHub.

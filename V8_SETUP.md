# TRIPAN V8 setup

1. Open PowerShell in this folder.
2. Run `npm install`.
3. Create `.env` from `.env.example` if needed and set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PORT`, and `JWT_SECRET`.
4. Run `npm start`.
5. Open http://localhost:3000.

V8 fixes the places-schema mismatch for installations where `places.visit_duration` does not exist, removes the invalid Leaflet SRI hashes, fixes the auth profile response mismatch, and renders place objects correctly.

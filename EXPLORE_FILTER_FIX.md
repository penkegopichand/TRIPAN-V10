# TRIPAN V8 — Explore Filter Fix

Fixed the Explore category filters.

## What changed
- `/api/destinations` now derives destination tags from the actual `places.category` values in Supabase.
- `/api/destinations/:id` also returns those derived tags.
- Beach/Nature/Heritage/Adventure filters now work case-insensitively.
- Search also considers destination tags.
- An empty-result message is shown instead of a blank Explore page.
- Destination image URLs and the existing working image system were not changed.

## Important
The private `.env` file is intentionally not included in this ZIP.
Keep the `.env` from your existing TRIPAN V8 folder and run:

```powershell
npm install
npm start
```

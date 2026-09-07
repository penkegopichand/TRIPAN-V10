# TRIPAN V10 — Smart Tourism Platform

TRIPAN is an SIH prototype travel platform for discovering Indian destinations, exploring attractions, checking live weather, and generating multi-day itineraries.

## Stack
- HTML5, CSS3, JavaScript
- Node.js + Express
- Supabase (destination/place data)
- Open-Meteo (live weather)
- Leaflet + OpenStreetMap (interactive maps)
- bcryptjs + JWT (prototype authentication/session)
- Local JSON storage for prototype users/trips/favorites

## Planner architecture
The itinerary generator uses the TRIPAN Smart Planner based on verified destination places, user preferences, trip duration, traveller count, pace, stay style, budget context, and live weather.

## Run
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Environment
Create `.env` with:
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=replace_with_a_random_secret
```

Never commit real credentials to source control.

## Main features
- Home destination discovery
- Explore destinations and category filters
- Destination detail pages
- Login/register
- Favorites
- Plan My Trip
- Live multi-day weather
- Smart local itinerary generation
- Traveller count
- Budget-aware trip summary
- Save/review trips in My Trips
- Responsive UI


## Admin dashboard access

The Admin dashboard is now protected on the server as well as hidden from normal users in the UI.

Set the email address that should have admin access in `.env`:

```env
ADMIN_EMAIL=your-admin-email@example.com
```

For multiple admins, use:

```env
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

Restart the server after changing `.env`:

```bash
npm run dev
```

Normal authenticated users can use TRIPAN features but receive `403 Admin access required` if they try to call the admin API directly.

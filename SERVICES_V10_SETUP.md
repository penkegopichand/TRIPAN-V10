# TRIPAN V10 — Services setup

## What was fixed

The V10 frontend already called:

- `GET /api/hotels`
- `GET /api/restaurants`

but the backend did not expose those endpoints. The result was a broken Services page.

This patch adds both endpoints and connects them directly to Supabase.

## Hotel fields

The Services page understands these fields:

- `name`
- `destination_id`
- `price_range`
- `rating`
- `location`
- `stay_style`
- `review_count`
- `image_url`
- `maps_url`

## Restaurant fields

- `name`
- `destination_id`
- `cuisine`
- `price_range`
- `rating`
- `location`
- `review_count`
- `image_url`
- `maps_url`

## User experience

The Services page now has:

- hotel cards
- restaurant cards
- destination filter
- rating display
- price information
- location information
- review count when available
- Google Maps link for each business
- responsive layout
- clear empty/error states

## Data source decision

For the SIH prototype, keep the service catalogue in Supabase. Do not add a live Google Places API dependency unless live business search/reviews are specifically required.

A Google Maps search link can be generated from the business name and destination without storing a Google API key in the website.

If you later want automatic live Google ratings/review counts/opening hours, that is a separate Google Places integration and may have quota/billing requirements.

## Setup

1. Open Supabase SQL Editor.
2. Run `TRIPAN_SERVICES_SUPABASE.sql`.
3. Add verified hotel and restaurant rows.
4. Restart TRIPAN:

```bash
npm run dev
```

5. Open `http://localhost:3000`.
6. Open **Services → Hotels** or **Services → Restaurants**.

## Important

The service API uses `select("*")` and normalizes common column names. This makes the frontend tolerant of small schema differences between older prototype tables.

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "";
const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
  .split(",")
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

function isAdminUser(user) {
  return Boolean(user?.email && ADMIN_EMAILS.includes(String(user.email).trim().toLowerCase()));
}


const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "db.json");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ users: [], trips: [], favorites: [], feedback: [] }, null, 2));
}

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(dbFile, "utf8"));
  } catch {
    return { users: [], trips: [], favorites: [], feedback: [] };
  }
}

function writeDB(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

function id() {
  return crypto.randomUUID();
}

function authToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name || "" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

function adminAuth(req, res, next) {
  if (!req.user || !isAdminUser(req.user)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function escapeLike(value) {
  return String(value || "").replace(/[%_]/g, m => "\\" + m);
}

const DESTINATION_IMAGES = {
  "Ahmedabad": "https://upload.wikimedia.org/wikipedia/commons/8/8e/Sabarmati_riverside.jpg",
  "Araku Valley": "https://upload.wikimedia.org/wikipedia/commons/b/b0/Araku-valley.jpg",
  "Darjeeling": "https://upload.wikimedia.org/wikipedia/commons/9/96/DarjeelingTrainFruitshop_%282%29.jpg",
  "Gangtok": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Kangch-Goechala.jpg",
  "Goa": "https://upload.wikimedia.org/wikipedia/commons/f/fc/BeachFun.jpg",
  "Hyderabad": "https://upload.wikimedia.org/wikipedia/commons/8/88/Downtown_hyderabad_drone.png",
  "Jaipur": "https://upload.wikimedia.org/wikipedia/commons/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg",
  "Manali": "https://upload.wikimedia.org/wikipedia/commons/0/03/Manali_City.jpg",
  "Mumbai": "https://upload.wikimedia.org/wikipedia/commons/2/2b/Mumbai_Bandra-Worli_Sea_Link.jpg",
  "Munnar": "https://upload.wikimedia.org/wikipedia/commons/b/b9/Munnar_Overview.jpg",
  "Mysuru": "https://upload.wikimedia.org/wikipedia/commons/5/56/Mysuru_Montage.jpg",
  "New Delhi": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Forecourt%2C_Rashtrapati_Bhavan_-_1.jpg",
  "Ooty": "https://upload.wikimedia.org/wikipedia/commons/d/db/Ooty_lake.jpg",
  "Puri": "https://upload.wikimedia.org/wikipedia/commons/6/6e/Shri_Jagannatha_Temple.jpg",
  "Rishikesh": "https://upload.wikimedia.org/wikipedia/commons/7/74/Trayambakeshwar_Temple_VK.jpg",
  "Shillong": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Elephant_Falls_II%2C_Shillong.jpg",
  "Srinagar": "https://upload.wikimedia.org/wikipedia/commons/a/ad/Red_and_Yellow_Tulips.JPG",
  "Visakhapatnam": "https://upload.wikimedia.org/wikipedia/commons/5/55/What_is_Shipyard.jpg"
};
const DEFAULT_DESTINATION_IMAGE = "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85";

function destinationImage(d) {
  const supplied = String(d.image_url || d.image || "").trim();
  return DESTINATION_IMAGES[String(d.name || "").trim()] || supplied || DEFAULT_DESTINATION_IMAGE;
}

function destinationOut(d) {
  return {
    id: d.id,
    name: d.name,
    state: d.state || "",
    country: d.country || "India",
    description: d.description || "",
    lat: Number(d.latitude ?? d.lat ?? 0),
    lng: Number(d.longitude ?? d.lng ?? 0),
    coordinates: {
      lat: Number(d.latitude ?? d.lat ?? 0),
      lng: Number(d.longitude ?? d.lng ?? 0)
    },
    image: destinationImage(d),
    image_url: destinationImage(d),
    emoji: d.emoji || "📍",
    rating: Number(d.rating || 4.7),
    tags: Array.isArray(d.tags) ? d.tags : []
  };
}

function placeOut(p) {
  return {
    id: p.id,
    destination_id: p.destination_id,
    name: p.name,
    category: p.category || "Attraction",
    description: p.description || "",
    latitude: Number(p.latitude ?? p.lat ?? 0),
    longitude: Number(p.longitude ?? p.lng ?? 0),
    entry_fee: Number(p.entry_fee || 0),
    visit_duration: p.visit_duration || "",
    image: p.image_url || p.image || "",
    image_url: p.image_url || p.image || "",
    emoji: p.emoji || "📍"
  };
}

async function getDestination(destinationId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("destinations")
    .select("id,name,state,country,description,latitude,longitude,image_url")
    .eq("id", destinationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/* -------------------- HEALTH -------------------- */

app.get("/api/health", async (req, res) => {
  let supabaseStatus = "not_configured";

  if (supabase) {
    const { error } = await supabase
      .from("destinations")
      .select("id", { count: "exact", head: true });
    supabaseStatus = error ? "error" : "connected";
  }

  res.json({
    ok: true,
    app: "TRIPAN",
    version: "10.0.0",
    supabase: supabaseStatus,
    planner: "local"
  });
});

/* -------------------- DESTINATIONS -------------------- */

app.get("/api/destinations", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: "Supabase is not configured. Create .env from .env.example."
      });
    }

    const { data, error } = await supabase
      .from("destinations")
      .select("id,name,state,country,description,latitude,longitude,image_url")
      .order("name", { ascending: true });

    if (error) throw error;

    // Build destination filter tags from the actual place categories.
    // This keeps Explore filters (Beach/Nature/Heritage/Adventure) in sync
    // with the places stored in Supabase instead of relying on a missing
    // `destinations.tags` column.
    const destinationRows = Array.isArray(data) ? data : [];
    const destinationIds = destinationRows.map(d => d.id);

    let placeRows = [];
    if (destinationIds.length) {
      const { data: placesData, error: placesError } = await supabase
        .from("places")
        .select("destination_id,category")
        .in("destination_id", destinationIds);

      if (placesError) throw placesError;
      placeRows = Array.isArray(placesData) ? placesData : [];
    }

    const categoryAliases = {
      beach: "Beach",
      beaches: "Beach",
      nature: "Nature",
      heritage: "Heritage",
      adventure: "Adventure",
      culture: "Culture",
      food: "Food",
      city: "City",
      shopping: "Shopping",
      hills: "Hills",
      relax: "Relax",
      family: "Family"
    };

    const tagsByDestination = new Map();

    for (const place of placeRows) {
      const key = String(place.destination_id || "");
      const rawCategory = String(place.category || "").trim();
      const canonical = categoryAliases[rawCategory.toLowerCase()] || rawCategory;
      if (!canonical) continue;

      if (!tagsByDestination.has(key)) tagsByDestination.set(key, []);
      const tags = tagsByDestination.get(key);
      if (!tags.includes(canonical)) tags.push(canonical);
    }

    res.json(destinationRows.map(d => ({
      ...destinationOut(d),
      tags: tagsByDestination.get(String(d.id)) || []
    })));
  } catch (error) {
    console.error("GET /api/destinations:", error);
    res.status(500).json({ error: "Could not load destinations", details: error.message });
  }
});

app.get("/api/destinations/:id", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: "Supabase is not configured" });
    }

    const destination = await getDestination(req.params.id);
    if (!destination) return res.status(404).json({ error: "Destination not found" });

    const { data: places, error: placesError } = await supabase
      .from("places")
      .select("id,destination_id,name,category,description,latitude,longitude,entry_fee,image_url")
      .eq("destination_id", destination.id)
      .order("name", { ascending: true });

    if (placesError) throw placesError;

    let hotels = [];
    let restaurants = [];

    const hotelsResult = await supabase
      .from("hotels")
      .select("*")
      .eq("destination_id", destination.id)
      .limit(20);

    if (!hotelsResult.error && Array.isArray(hotelsResult.data)) hotels = hotelsResult.data;

    const restaurantsResult = await supabase
      .from("restaurants")
      .select("*")
      .eq("destination_id", destination.id)
      .limit(20);

    if (!restaurantsResult.error && Array.isArray(restaurantsResult.data)) restaurants = restaurantsResult.data;

    const destinationTags = [...new Set(
      (places || [])
        .map(p => {
          const raw = String(p.category || "").trim();
          const aliases = {
            beach: "Beach", beaches: "Beach", nature: "Nature",
            heritage: "Heritage", adventure: "Adventure", culture: "Culture",
            food: "Food", city: "City", shopping: "Shopping",
            hills: "Hills", relax: "Relax", family: "Family"
          };
          return aliases[raw.toLowerCase()] || raw;
        })
        .filter(Boolean)
    )];

    res.json({
      ...destinationOut(destination),
      tags: destinationTags,
      places: (places || []).map(placeOut),
      hotels,
      restaurants
    });
  } catch (error) {
    console.error("GET /api/destinations/:id:", error);
    res.status(500).json({ error: "Could not load destination", details: error.message });
  }
});

/* Direct places endpoint for flexible frontend use */
app.get("/api/places", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase is not configured" });

    let query = supabase
      .from("places")
      .select("id,destination_id,name,category,description,latitude,longitude,entry_fee,image_url")
      .order("name", { ascending: true });

    if (req.query.destination_id) {
      query = query.eq("destination_id", req.query.destination_id);
    }

    if (req.query.category) {
      query = query.eq("category", req.query.category);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(placeOut));
  } catch (error) {
    console.error("GET /api/places:", error);
    res.status(500).json({ error: "Could not load places", details: error.message });
  }
});


/* -------------------- LOCAL SERVICES -------------------- */

function serviceValue(row, keys, fallback = "") {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }
  return fallback;
}

function normalizeHotel(row) {
  return {
    id: row.id || id(),
    destination_id: row.destination_id || null,
    name: String(serviceValue(row, ["name", "hotel_name", "property_name"], "Hotel")),
    price_range: String(serviceValue(row, ["price_range", "price", "price_per_night", "nightly_price"], "Price unavailable")),
    rating: Number(serviceValue(row, ["rating", "review_rating", "stars"], 0)) || 0,
    location: String(serviceValue(row, ["location", "area", "address"], "Local area")),
    stay_style: String(serviceValue(row, ["stay_style", "category", "type"], "Stay")),
    review_count: Number(serviceValue(row, ["review_count", "reviews", "reviews_count"], 0)) || 0,
    image_url: String(serviceValue(row, ["image_url", "image"], "")),
    maps_url: String(serviceValue(row, ["maps_url", "google_maps_url"], ""))
  };
}

function normalizeRestaurant(row) {
  return {
    id: row.id || id(),
    destination_id: row.destination_id || null,
    name: String(serviceValue(row, ["name", "restaurant_name", "business_name"], "Restaurant")),
    cuisine: String(serviceValue(row, ["cuisine", "cuisines", "food_type"], "Local cuisine")),
    price_range: String(serviceValue(row, ["price_range", "price", "cost_for_two", "average_cost"], "Price unavailable")),
    rating: Number(serviceValue(row, ["rating", "review_rating", "stars"], 0)) || 0,
    location: String(serviceValue(row, ["location", "area", "address"], "Local area")),
    review_count: Number(serviceValue(row, ["review_count", "reviews", "reviews_count"], 0)) || 0,
    image_url: String(serviceValue(row, ["image_url", "image"], "")),
    maps_url: String(serviceValue(row, ["maps_url", "google_maps_url"], ""))
  };
}

async function loadServiceRows(table, destinationId) {
  if (!supabase) throw new Error("Supabase is not configured");

  let query = supabase.from(table).select("*").limit(200);
  if (destinationId) query = query.eq("destination_id", destinationId);

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

app.get("/api/hotels", async (req, res) => {
  try {
    const rows = await loadServiceRows("hotels", req.query.destination_id);
    const hotels = rows.map(normalizeHotel).sort((a, b) => {
      const ratingDiff = b.rating - a.rating;
      return ratingDiff || a.name.localeCompare(b.name);
    });
    res.json(hotels);
  } catch (error) {
    console.error("GET /api/hotels:", error);
    res.status(500).json({ error: "Could not load hotels", details: error.message });
  }
});

app.get("/api/restaurants", async (req, res) => {
  try {
    const rows = await loadServiceRows("restaurants", req.query.destination_id);
    const restaurants = rows.map(normalizeRestaurant).sort((a, b) => {
      const ratingDiff = b.rating - a.rating;
      return ratingDiff || a.name.localeCompare(b.name);
    });
    res.json(restaurants);
  } catch (error) {
    console.error("GET /api/restaurants:", error);
    res.status(500).json({ error: "Could not load restaurants", details: error.message });
  }
});


function normalizeTransport(row) {
  return {
    id: row.id || null,
    destination_id: row.destination_id || null,
    type: String(serviceValue(row, ["type", "transport_type", "category"], "Local transport")),
    name: String(serviceValue(row, ["name", "service_name", "provider"], "Local transport")),
    fare_range: String(serviceValue(row, ["fare_range", "price_range", "fare", "cost"], "Fare varies")),
    location: String(serviceValue(row, ["location", "area", "address"], "Local area")),
    availability: String(serviceValue(row, ["availability", "hours"], "Check locally")),
    description: String(serviceValue(row, ["description", "details"], "Useful local travel option.")),
    image_url: String(serviceValue(row, ["image_url", "image"], "")),
    maps_url: String(serviceValue(row, ["maps_url", "google_maps_url"], ""))
  };
}

app.get("/api/transport", async (req, res) => {
  try {
    const rows = await loadServiceRows("transport_options", req.query.destination_id);
    const transport = rows.map(normalizeTransport).sort((a, b) => {
      const order = { "Public bus": 1, "Train": 2, "Metro": 3, "Taxi / Cab": 4, "Auto-rickshaw": 5, "Bike / Scooter rental": 6 };
      return (order[a.type] || 99) - (order[b.type] || 99) || a.name.localeCompare(b.name);
    });
    res.json(transport);
  } catch (error) {
    console.error("GET /api/transport:", error);
    res.status(500).json({ error: "Could not load transport options", details: error.message });
  }
});

/* -------------------- WEATHER -------------------- */

function weatherCondition(code) {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Unknown";
}

const weatherCache = new Map();

async function getWeather(lat, lng, startDate, days = 5) {
  const safeDays = Math.min(Math.max(Number(days) || 5, 1), 16);
  const key = `${lat},${lng},${startDate || "auto"},${safeDays}`;

  // Use cached weather for 30 minutes
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.time < 30 * 60 * 1000) {
    return cached.data;
  }

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto"
  });

  if (startDate) {
    params.set("start_date", startDate);
    params.set("end_date", dateAdd(startDate, safeDays - 1));
  } else {
    params.set("forecast_days", String(safeDays));
  }

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;

  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();

        weatherCache.set(key, {
          time: Date.now(),
          data
        });

        return data;
      }

      lastError = new Error(
        `Weather provider returned ${response.status}`
      );

      if (response.status === 429 && attempt < 3) {
        console.log(`Weather rate limited. Retry ${attempt}/3...`);
        await new Promise(resolve =>
          setTimeout(resolve, attempt * 3000)
        );
        continue;
      }

      break;

    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        await new Promise(resolve =>
          setTimeout(resolve, attempt * 1000)
        );
      }
    }
  }

  // Use older cached weather if provider is temporarily unavailable
  if (cached) {
    console.log("Using cached weather because provider is unavailable.");
    return cached.data;
  }

  throw lastError || new Error("Weather provider unavailable");
}

app.get("/api/weather/:id", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase is not configured" });

    const destination = await getDestination(req.params.id);
    if (!destination) return res.status(404).json({ error: "Destination not found" });

    const days = Math.min(Math.max(Number(req.query.days) || 5, 1), 7);
    const weather = await getWeather(destination.latitude, destination.longitude, req.query.startDate, days);

    const forecast = (weather.daily?.time || []).map((date, i) => ({
      date,
      max: Math.round(weather.daily.temperature_2m_max[i]),
      min: Math.round(weather.daily.temperature_2m_min[i]),
      rainChance: weather.daily.precipitation_probability_max?.[i] ?? 0,
      code: weather.daily.weather_code[i],
      condition: weatherCondition(weather.daily.weather_code[i])
    }));

    res.json({
      destination: destination.name,
      coordinates: {
        lat: Number(destination.latitude),
        lng: Number(destination.longitude)
      },
      source: "Open-Meteo",
      forecast
    });
  } catch (error) {
    console.error("GET /api/weather/:id:", error);
    res.status(503).json({ error: "Weather service unavailable", details: error.message });
  }
});


/* -------------------- SMART PLANNER -------------------- */

const INTEREST_ICONS = {
  Beach: "🏖️", Nature: "🌿", Heritage: "🏛️", Adventure: "🧗",
  Culture: "🎭", Food: "🍛", City: "🏙️", Shopping: "🛍️", Hills: "⛰️"
};

const FALLBACK_EXPERIENCES = {
  "Ahmedabad": [
    [
      "Sabarmati Riverfront",
      "Nature",
      "Enjoy a riverside walk and views along the Sabarmati."
    ],
    [
      "Sabarmati Ashram",
      "Heritage",
      "Visit the historic ashram associated with Mahatma Gandhi."
    ],
    [
      "Adalaj Stepwell",
      "Heritage",
      "Explore the intricately carved historic stepwell."
    ],
    [
      "Manek Chowk",
      "Food",
      "Explore Ahmedabad's famous evening street-food area."
    ],
    [
      "Sidi Saiyyed Mosque",
      "Heritage",
      "See the historic mosque known for its carved stonework."
    ],
    [
      "Kankaria Lake",
      "Nature",
      "Enjoy the lakefront, gardens and family attractions."
    ],
    [
      "Jama Masjid",
      "Heritage",
      "Visit the historic congregational mosque in the old city."
    ],
    [
      "Bhadra Fort",
      "Heritage",
      "Explore the historic fort and surrounding old-city district."
    ],
    [
      "Teen Darwaza",
      "Heritage",
      "See the historic gateway in Ahmedabad's old city."
    ],
    [
      "Calico Museum of Textiles",
      "Culture",
      "Explore India's textile traditions and collections."
    ],
    [
      "Hutheesing Jain Temple",
      "Heritage",
      "Admire the ornate Jain temple architecture."
    ],
    [
      "Science City Ahmedabad",
      "Family",
      "Explore science exhibits and educational attractions."
    ],
    [
      "Sarkhej Roza",
      "Heritage",
      "Discover the historic architectural complex and water features."
    ],
    [
      "Law Garden",
      "Shopping",
      "Browse handicrafts and local shopping around the garden area."
    ],
    [
      "Auto World Vintage Car Museum",
      "Culture",
      "See a collection of historic automobiles and transport exhibits."
    ]
  ],
  "Araku Valley": [
    [
      "Borra Caves",
      "Nature",
      "Explore the dramatic limestone cave formations."
    ],
    [
      "Araku Tribal Museum",
      "Culture",
      "Learn about local tribal culture and traditions."
    ],
    [
      "Coffee Museum",
      "Culture",
      "Discover Araku's coffee-growing story."
    ],
    [
      "Araku Valley Viewpoints",
      "Nature",
      "Take in panoramic valley and hill scenery."
    ],
    [
      "Padmapuram Gardens",
      "Nature",
      "Walk through the landscaped gardens and tree-top features."
    ],
    [
      "Chaparai Waterfalls",
      "Nature",
      "Visit the scenic natural cascade near Araku."
    ],
    [
      "Galikonda View Point",
      "Nature",
      "Enjoy views across the Eastern Ghats landscape."
    ],
    [
      "Ananthagiri Hills",
      "Nature",
      "Explore forested hills and scenic viewpoints."
    ],
    [
      "Dhimsa Dance Village Experience",
      "Culture",
      "Experience a traditional local cultural performance when available."
    ],
    [
      "Katiki Waterfalls",
      "Adventure",
      "Take a nature outing toward the waterfall area."
    ],
    [
      "Coffee Plantations",
      "Nature",
      "See the coffee-growing landscapes around the valley."
    ],
    [
      "Araku Railway Tunnel View",
      "Nature",
      "Enjoy the dramatic mountain railway scenery."
    ],
    [
      "Matsyagundam",
      "Nature",
      "Visit a small scenic water and temple area."
    ],
    [
      "Duduma Waterfalls Excursion",
      "Nature",
      "Take a longer nature excursion toward the Duduma falls region."
    ],
    [
      "Galiconda Peak Area",
      "Adventure",
      "Explore the highland scenery around the Eastern Ghats."
    ]
  ],
  "Darjeeling": [
    [
      "Tiger Hill",
      "Nature",
      "Catch panoramic Himalayan views around sunrise."
    ],
    [
      "Darjeeling Himalayan Railway",
      "Adventure",
      "Experience the famous mountain railway."
    ],
    [
      "Batasia Loop",
      "Nature",
      "Enjoy mountain scenery around the railway loop."
    ],
    [
      "Darjeeling Mall Road",
      "Culture",
      "Walk the town centre and explore local cafés and shops."
    ],
    [
      "Darjeeling Peace Pagoda",
      "Culture",
      "Visit the hilltop pagoda and enjoy peaceful views."
    ],
    [
      "Padmaja Naidu Himalayan Zoological Park",
      "Nature",
      "See Himalayan wildlife in a mountain setting."
    ],
    [
      "Himalayan Mountaineering Institute",
      "Culture",
      "Explore mountaineering history and exhibits."
    ],
    [
      "Happy Valley Tea Estate",
      "Nature",
      "Walk around a famous Darjeeling tea estate."
    ],
    [
      "Japanese Peace Pagoda",
      "Culture",
      "Visit the peaceful white pagoda overlooking Darjeeling."
    ],
    [
      "Nightingale Park",
      "Nature",
      "Relax in a hilltop park with mountain views."
    ],
    [
      "Mahakal Temple",
      "Heritage",
      "Visit the hilltop temple area near Observatory Hill."
    ],
    [
      "Rock Garden",
      "Nature",
      "Explore the landscaped garden and mountain streams."
    ],
    [
      "Ghoom Monastery",
      "Heritage",
      "Visit one of the area's historic Buddhist monasteries."
    ],
    [
      "Lloyd's Botanical Garden",
      "Nature",
      "Explore Himalayan and alpine plant collections."
    ],
    [
      "Tenzing Rock",
      "Adventure",
      "See the climbing landmark associated with Himalayan mountaineering."
    ]
  ],
  "Gangtok": [
    [
      "MG Marg",
      "Culture",
      "Explore Gangtok's pedestrian centre, cafés and shops."
    ],
    [
      "Rumtek Monastery",
      "Heritage",
      "Visit one of Sikkim's best-known monasteries."
    ],
    [
      "Tsomgo Lake",
      "Nature",
      "See the high-altitude lake and surrounding mountains."
    ],
    [
      "Hanuman Tok",
      "Nature",
      "Enjoy elevated views over Gangtok."
    ],
    [
      "Nathula Pass",
      "Adventure",
      "Visit the historic mountain pass when permits and weather allow."
    ],
    [
      "Banjhakri Falls",
      "Nature",
      "Explore the landscaped waterfall park and forest setting."
    ],
    [
      "Enchey Monastery",
      "Heritage",
      "Visit the historic monastery overlooking Gangtok."
    ],
    [
      "Namgyal Institute of Tibetology",
      "Culture",
      "Explore Tibetan Buddhist art, manuscripts and culture."
    ],
    [
      "Do Drul Chorten",
      "Heritage",
      "See the prominent Buddhist stupa in Gangtok."
    ],
    [
      "Tashi View Point",
      "Nature",
      "Enjoy Himalayan views from the viewpoint."
    ],
    [
      "Ganesh Tok",
      "Nature",
      "Take in mountain and city views from the hilltop."
    ],
    [
      "Flower Exhibition Centre",
      "Nature",
      "See seasonal flowers and Himalayan plant displays."
    ],
    [
      "Sikkim Himalayan Zoological Park",
      "Nature",
      "Explore a high-altitude wildlife park."
    ],
    [
      "Seven Sisters Waterfall",
      "Nature",
      "Visit a scenic waterfall on the mountain road."
    ],
    [
      "Bakthang Waterfall",
      "Nature",
      "See the broad cascade surrounded by Himalayan scenery."
    ]
  ],
  "Goa": [
    [
      "Baga Beach",
      "Beach",
      "Relax by the coast and enjoy the beach atmosphere."
    ],
    [
      "Calangute Beach",
      "Beach",
      "Spend time on one of North Goa's best-known beaches."
    ],
    [
      "Anjuna Beach",
      "Beach",
      "Enjoy the coast and nearby market culture."
    ],
    [
      "Fort Aguada",
      "Heritage",
      "Explore the historic Portuguese-era fort and sea views."
    ],
    [
      "Basilica of Bom Jesus",
      "Heritage",
      "Visit one of Old Goa's landmark churches."
    ],
    [
      "Se Cathedral",
      "Heritage",
      "See the grand historic cathedral in Old Goa."
    ],
    [
      "Panaji Latin Quarter",
      "Culture",
      "Walk through colourful heritage streets and cafés."
    ],
    [
      "Dona Paula",
      "Nature",
      "Enjoy waterfront views and the coastal promenade."
    ],
    [
      "Chapora Fort",
      "Heritage",
      "Explore the hilltop fort and sea views."
    ],
    [
      "Palolem Beach",
      "Beach",
      "Relax on the scenic South Goa coastline."
    ],
    [
      "Dudhsagar Falls",
      "Adventure",
      "Take a nature excursion to the famous waterfall area."
    ],
    [
      "Fontainhas",
      "Culture",
      "Walk through Panaji's colourful Portuguese-influenced quarter."
    ],
    [
      "Spice Plantation",
      "Nature",
      "Learn about tropical spices and plantation life."
    ],
    [
      "Salim Ali Bird Sanctuary",
      "Nature",
      "Explore mangroves and bird habitat by the Mandovi."
    ],
    [
      "Reis Magos Fort",
      "Heritage",
      "Visit the restored fort overlooking the Mandovi River."
    ]
  ],
  "Hyderabad": [
    [
      "Charminar",
      "Heritage",
      "Explore Hyderabad's iconic monument and old-city streets."
    ],
    [
      "Golconda Fort",
      "Heritage",
      "Discover the fort's architecture, history and viewpoints."
    ],
    [
      "Salar Jung Museum",
      "Culture",
      "Browse major art and antiquities collections."
    ],
    [
      "Laad Bazaar",
      "Shopping",
      "Shop for bangles, crafts and local souvenirs near Charminar."
    ],
    [
      "Chowmahalla Palace",
      "Heritage",
      "Explore the historic palace complex and royal courtyards."
    ],
    [
      "Qutb Shahi Tombs",
      "Heritage",
      "Visit the elegant domed tomb complex."
    ],
    [
      "Hussain Sagar Lake",
      "Nature",
      "Enjoy the lakeside promenade and Buddha statue views."
    ],
    [
      "Lumbini Park",
      "Nature",
      "Relax in the central city park beside Hussain Sagar."
    ],
    [
      "Birla Mandir",
      "Heritage",
      "Visit the hilltop marble temple and city views."
    ],
    [
      "NTR Gardens",
      "Nature",
      "Take a relaxed walk through landscaped gardens."
    ],
    [
      "Nehru Zoological Park",
      "Nature",
      "Explore one of India's major urban zoological parks."
    ],
    [
      "Shilparamam",
      "Culture",
      "Discover handicrafts, folk art and cultural performances."
    ],
    [
      "Durgam Cheruvu",
      "Nature",
      "Enjoy the lake and modern western Hyderabad surroundings."
    ],
    [
      "Mecca Masjid",
      "Heritage",
      "See one of Hyderabad's historic landmarks near Charminar."
    ],
    [
      "Telangana State Archaeology Museum",
      "Culture",
      "Explore archaeological collections and historic artefacts."
    ]
  ],
  "Jaipur": [
    [
      "Amber Fort",
      "Heritage",
      "Explore the grand hilltop fort and palace complex."
    ],
    [
      "Hawa Mahal",
      "Heritage",
      "See Jaipur's iconic palace façade and old-city area."
    ],
    [
      "City Palace",
      "Culture",
      "Discover royal courtyards, museums and architecture."
    ],
    [
      "Johari Bazaar",
      "Shopping",
      "Browse jewellery, textiles and local handicrafts."
    ],
    [
      "Jantar Mantar",
      "Heritage",
      "Explore the historic astronomical instruments."
    ],
    [
      "Jal Mahal",
      "Heritage",
      "View the palace set in Man Sagar Lake."
    ],
    [
      "Nahargarh Fort",
      "Heritage",
      "Enjoy hilltop views over Jaipur from the historic fort."
    ],
    [
      "Jaigarh Fort",
      "Heritage",
      "Explore the hill fort and its historic defences."
    ],
    [
      "Albert Hall Museum",
      "Culture",
      "Visit Jaipur's major museum in Ram Niwas Garden."
    ],
    [
      "Galtaji",
      "Heritage",
      "Explore the temple complex and surrounding hills."
    ],
    [
      "Birla Mandir Jaipur",
      "Heritage",
      "See the white marble temple and landscaped grounds."
    ],
    [
      "Patrika Gate",
      "Culture",
      "See the colourful architectural gateway and photo spot."
    ],
    [
      "Central Park Jaipur",
      "Nature",
      "Relax in one of the city's large urban parks."
    ],
    [
      "Nahargarh Biological Park",
      "Nature",
      "Explore the wildlife area at the foot of the Aravalli hills."
    ],
    [
      "Bapu Bazaar",
      "Shopping",
      "Browse textiles, handicrafts and local shopping streets."
    ]
  ],
  "Manali": [
    [
      "Solang Valley",
      "Adventure",
      "Enjoy mountain scenery and seasonal adventure activities."
    ],
    [
      "Hidimba Devi Temple",
      "Heritage",
      "Visit the distinctive wooden temple in cedar forest."
    ],
    [
      "Old Manali",
      "Culture",
      "Explore cafés, local shops and village atmosphere."
    ],
    [
      "Mall Road",
      "Shopping",
      "Walk the main town centre and local shops."
    ],
    [
      "Vashisht Temple",
      "Heritage",
      "Visit the historic temple and nearby hot springs."
    ],
    [
      "Manu Temple",
      "Heritage",
      "Explore the temple area in Old Manali."
    ],
    [
      "Jogini Waterfall",
      "Nature",
      "Take a scenic hike toward the waterfall."
    ],
    [
      "Beas River",
      "Nature",
      "Enjoy riverside scenery and relaxed walks."
    ],
    [
      "Atal Tunnel",
      "Adventure",
      "Take a mountain excursion through the engineering landmark."
    ],
    [
      "Rohtang Pass",
      "Adventure",
      "Visit the high mountain pass when open and permitted."
    ],
    [
      "Nehru Kund",
      "Nature",
      "See the clear spring and mountain surroundings."
    ],
    [
      "Van Vihar National Park",
      "Nature",
      "Walk among deodar trees near the Beas."
    ],
    [
      "Arjun Gufa",
      "Nature",
      "Explore the cave area and nearby forest scenery."
    ],
    [
      "Sethan Village",
      "Adventure",
      "Experience a quiet Himalayan village and seasonal activities."
    ],
    [
      "Naggar Castle",
      "Heritage",
      "Visit the historic castle and surrounding mountain views."
    ]
  ],
  "Mumbai": [
    [
      "Gateway of India",
      "Heritage",
      "Visit Mumbai's waterfront landmark."
    ],
    [
      "Marine Drive",
      "Nature",
      "Enjoy a scenic seafront walk and sunset views."
    ],
    [
      "Chhatrapati Shivaji Maharaj Terminus",
      "Heritage",
      "See celebrated historic railway architecture."
    ],
    [
      "Colaba Causeway",
      "Shopping",
      "Browse markets, cafés and local shops."
    ],
    [
      "Elephanta Caves",
      "Heritage",
      "Explore the historic rock-cut cave complex on Elephanta Island."
    ],
    [
      "Sanjay Gandhi National Park",
      "Nature",
      "Explore green landscapes and wildlife within the city."
    ],
    [
      "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya",
      "Culture",
      "Visit the major museum near Kala Ghoda."
    ],
    [
      "Bandra-Worli Sea Link Viewpoint",
      "City",
      "See Mumbai's landmark bridge and waterfront skyline."
    ],
    [
      "Bandra Fort",
      "Heritage",
      "Explore the seaside fort and views toward the sea link."
    ],
    [
      "Juhu Beach",
      "Beach",
      "Enjoy the popular Mumbai beachfront and evening atmosphere."
    ],
    [
      "Haji Ali Dargah",
      "Heritage",
      "Visit the famous offshore shrine area, subject to access conditions."
    ],
    [
      "Siddhivinayak Temple",
      "Heritage",
      "Visit the well-known temple in central Mumbai."
    ],
    [
      "Kala Ghoda",
      "Culture",
      "Walk through Mumbai's arts and heritage district."
    ],
    [
      "Crawford Market",
      "Shopping",
      "Explore a historic market and surrounding old-city streets."
    ],
    [
      "Worli Sea Face",
      "Nature",
      "Enjoy a coastal walk and skyline views."
    ]
  ],
  "Munnar": [
    [
      "Tea Museum",
      "Culture",
      "Learn about Munnar's tea history and production."
    ],
    [
      "Mattupetty Dam",
      "Nature",
      "Enjoy reservoir and mountain scenery."
    ],
    [
      "Eravikulam National Park",
      "Nature",
      "Explore highland landscapes and wildlife habitat."
    ],
    [
      "Tea Gardens",
      "Nature",
      "Take a relaxed walk through Munnar's famous tea landscapes."
    ],
    [
      "Top Station",
      "Nature",
      "Enjoy expansive views across the Western Ghats."
    ],
    [
      "Echo Point",
      "Nature",
      "See the scenic lake and forested hills."
    ],
    [
      "Kundala Lake",
      "Nature",
      "Relax beside the reservoir amid mountain scenery."
    ],
    [
      "Anamudi Peak View Area",
      "Nature",
      "Enjoy views toward South India's highest peak; access is regulated."
    ],
    [
      "Pothamedu View Point",
      "Nature",
      "Take in tea, coffee and cardamom plantation views."
    ],
    [
      "Attukad Waterfalls",
      "Nature",
      "Visit the waterfall and surrounding valley scenery."
    ],
    [
      "Blossom Park",
      "Nature",
      "Relax in landscaped gardens near Munnar."
    ],
    [
      "Lockhart Gap",
      "Nature",
      "Enjoy mountain and valley views."
    ],
    [
      "Chokramudi Peak",
      "Adventure",
      "Take a mountain hike with local guidance."
    ],
    [
      "Rose Garden Munnar",
      "Nature",
      "Explore a hillside garden with mountain views."
    ],
    [
      "Chinnar Wildlife Sanctuary",
      "Nature",
      "Take a wildlife-focused excursion from the Munnar region."
    ]
  ],
  "Mysuru": [
    [
      "Mysore Palace",
      "Heritage",
      "Explore the grand royal palace and its architecture."
    ],
    [
      "Chamundi Hill",
      "Nature",
      "Take in views over Mysuru from the hilltop."
    ],
    [
      "Devaraja Market",
      "Food",
      "Explore local produce, flowers and traditional market life."
    ],
    [
      "Brindavan Gardens",
      "Nature",
      "Relax among landscaped gardens and evening fountains."
    ],
    [
      "St Philomena's Cathedral",
      "Heritage",
      "See the neo-Gothic cathedral and its distinctive architecture."
    ],
    [
      "Mysuru Zoo",
      "Nature",
      "Explore the historic zoological garden."
    ],
    [
      "Jaganmohan Palace",
      "Culture",
      "Visit the palace and art collection."
    ],
    [
      "Karanji Lake",
      "Nature",
      "Walk around the lake and bird habitat."
    ],
    [
      "Railway Museum Mysuru",
      "Culture",
      "Explore railway history and restored exhibits."
    ],
    [
      "Kukkarahalli Lake",
      "Nature",
      "Enjoy a peaceful lake walk close to the city."
    ],
    [
      "Ranganathittu Bird Sanctuary",
      "Nature",
      "Take a birdwatching excursion near Mysuru."
    ],
    [
      "Srirangapatna",
      "Heritage",
      "Explore the historic island town and monuments."
    ],
    [
      "Tipu Sultan's Summer Palace",
      "Heritage",
      "Visit the historic palace at Srirangapatna."
    ],
    [
      "Dariya Daulat Bagh",
      "Heritage",
      "Explore Tipu Sultan's summer palace and gardens."
    ],
    [
      "KRS Dam",
      "Nature",
      "Visit the reservoir and surrounding landscapes."
    ]
  ],
  "New Delhi": [
    [
      "India Gate",
      "Heritage",
      "Visit the national monument and surrounding green spaces."
    ],
    [
      "Qutub Minar",
      "Heritage",
      "Explore the historic tower and archaeological complex."
    ],
    [
      "Humayun's Tomb",
      "Heritage",
      "See the Mughal-era garden tomb and architecture."
    ],
    [
      "Chandni Chowk",
      "Food",
      "Explore old Delhi's markets and famous food streets."
    ],
    [
      "Red Fort",
      "Heritage",
      "Visit the historic Mughal fort complex."
    ],
    [
      "Lotus Temple",
      "Heritage",
      "See the distinctive modern temple architecture."
    ],
    [
      "Akshardham",
      "Culture",
      "Explore the large temple and cultural complex; check entry rules."
    ],
    [
      "Jama Masjid",
      "Heritage",
      "Visit the historic mosque in Old Delhi."
    ],
    [
      "National Museum",
      "Culture",
      "Explore major collections spanning Indian history."
    ],
    [
      "Lodhi Garden",
      "Nature",
      "Walk among historic tombs and landscaped gardens."
    ],
    [
      "Rashtrapati Bhavan",
      "Heritage",
      "See the presidential estate and surrounding ceremonial area; access varies."
    ],
    [
      "Gurudwara Bangla Sahib",
      "Culture",
      "Visit the prominent Sikh gurdwara and its peaceful complex."
    ],
    [
      "Dilli Haat",
      "Shopping",
      "Browse crafts, textiles and regional food stalls."
    ],
    [
      "Purana Qila",
      "Heritage",
      "Explore the historic fort and old Delhi landscape."
    ],
    [
      "National Zoological Park",
      "Nature",
      "Visit Delhi's major urban zoo near Purana Qila."
    ]
  ],
  "Ooty": [
    [
      "Ooty Lake",
      "Nature",
      "Relax beside the lake and enjoy the hill-station setting."
    ],
    [
      "Botanical Gardens",
      "Nature",
      "Explore landscaped gardens and mountain flora."
    ],
    [
      "Nilgiri Mountain Railway",
      "Adventure",
      "Experience the historic mountain railway route."
    ],
    [
      "Doddabetta Peak",
      "Nature",
      "Enjoy panoramic views from the Nilgiris' highest peak."
    ],
    [
      "Rose Garden",
      "Nature",
      "Explore the hillside rose garden."
    ],
    [
      "Tea Factory and Museum",
      "Culture",
      "Learn about Nilgiri tea production."
    ],
    [
      "Emerald Lake",
      "Nature",
      "Enjoy a quieter lake surrounded by hills."
    ],
    [
      "Avalanche Lake",
      "Nature",
      "Take a scenic nature excursion through the Nilgiri landscape."
    ],
    [
      "Pykara Lake",
      "Nature",
      "Enjoy the lake and surrounding forest scenery."
    ],
    [
      "Pykara Waterfalls",
      "Nature",
      "Visit the waterfall area near Pykara."
    ],
    [
      "Wenlock Downs",
      "Nature",
      "Explore open grassland landscapes and hill views."
    ],
    [
      "Ooty Rose Garden",
      "Nature",
      "Walk through extensive rose collections on the hillside."
    ],
    [
      "St Stephen's Church",
      "Heritage",
      "Visit one of Ooty's historic churches."
    ],
    [
      "Ooty Chocolate Museum",
      "Food",
      "Learn about local chocolate making and sample products."
    ],
    [
      "Coonoor Excursion",
      "Nature",
      "Take a nearby hill-station excursion for tea and views."
    ]
  ],
  "Puri": [
    [
      "Jagannath Temple",
      "Heritage",
      "Visit Puri's landmark temple complex and old-town area."
    ],
    [
      "Puri Beach",
      "Beach",
      "Relax on the coast and enjoy the sea breeze."
    ],
    [
      "Raghurajpur Artist Village",
      "Culture",
      "See traditional crafts and local artistic traditions."
    ],
    [
      "Chilika Lake",
      "Nature",
      "Take a nature-focused excursion around the famous lagoon."
    ],
    [
      "Gundicha Temple",
      "Heritage",
      "Visit the historic temple associated with the Jagannath tradition."
    ],
    [
      "Puri Swargadwar",
      "Beach",
      "Explore the lively beachfront and local atmosphere."
    ],
    [
      "Narendra Tank",
      "Heritage",
      "See the historic sacred water tank near the temple area."
    ],
    [
      "Konark Sun Temple",
      "Heritage",
      "Visit the UNESCO-listed temple complex on an excursion."
    ],
    [
      "Chandrabhaga Beach",
      "Beach",
      "Enjoy a quieter coastal stop near Konark."
    ],
    [
      "Pipili",
      "Shopping",
      "Browse colourful appliqué handicrafts and local textiles."
    ],
    [
      "Sudarsan Crafts Museum",
      "Culture",
      "Explore Odisha stone and wood craft traditions."
    ],
    [
      "Puri Heritage Walk",
      "Culture",
      "Explore old streets, crafts and temple-town architecture."
    ],
    [
      "Balighai Beach",
      "Nature",
      "Enjoy a scenic coastal and forest-side outing."
    ],
    [
      "Mangalajodi Wetlands",
      "Nature",
      "Take a birdwatching excursion in the Chilika region."
    ],
    [
      "Bhubaneswar Excursion",
      "Heritage",
      "Explore Odisha's temple architecture on a nearby city excursion."
    ]
  ],
  "Rishikesh": [
    [
      "Laxman Jhula Area",
      "Heritage",
      "Explore the riverside area and Himalayan views."
    ],
    [
      "Triveni Ghat",
      "Culture",
      "Experience the riverside atmosphere and evening rituals."
    ],
    [
      "River Rafting",
      "Adventure",
      "Try a guided rafting experience when conditions permit."
    ],
    [
      "Beatles Ashram",
      "Culture",
      "Explore the colourful former ashram and art spaces."
    ],
    [
      "Ram Jhula",
      "Heritage",
      "Walk across the iconic suspension bridge area."
    ],
    [
      "Neer Garh Waterfall",
      "Nature",
      "Hike through forest toward the waterfall."
    ],
    [
      "Parmarth Niketan",
      "Culture",
      "Visit the riverside ashram and evening Ganga ceremony."
    ],
    [
      "Sivananda Ashram",
      "Culture",
      "Explore the spiritual riverside area, subject to visitor rules."
    ],
    [
      "Kunjapuri Temple",
      "Adventure",
      "Take a hill excursion for sunrise and Himalayan views."
    ],
    [
      "Rajaji National Park",
      "Nature",
      "Take a wildlife excursion with permitted operators."
    ],
    [
      "Vashishta Gufa",
      "Heritage",
      "Visit the riverside cave and meditation area."
    ],
    [
      "Ganga Beach",
      "Nature",
      "Relax by the river at suitable designated areas."
    ],
    [
      "Yoga Experience",
      "Culture",
      "Join a reputable guided yoga session."
    ],
    [
      "Ganga Aarti",
      "Culture",
      "Experience the evening riverside ceremony."
    ],
    [
      "Garud Chatti Waterfall",
      "Nature",
      "Take a forest and waterfall outing with suitable conditions."
    ]
  ],
  "Shillong": [
    [
      "Elephant Falls",
      "Nature",
      "Visit one of Shillong's best-known waterfalls."
    ],
    [
      "Shillong Peak",
      "Nature",
      "Enjoy broad views over the city and surrounding hills."
    ],
    [
      "Ward's Lake",
      "Nature",
      "Relax around the landscaped lake in the city."
    ],
    [
      "Police Bazaar",
      "Food",
      "Explore local food, shopping and the city centre."
    ],
    [
      "Umiam Lake",
      "Nature",
      "Enjoy the large scenic reservoir north of Shillong."
    ],
    [
      "Laitlum Canyon",
      "Nature",
      "Take in dramatic valley and hill views."
    ],
    [
      "Don Bosco Museum",
      "Culture",
      "Explore galleries on Northeast Indian cultures."
    ],
    [
      "Cathedral of Mary Help of Christians",
      "Heritage",
      "Visit the prominent cathedral in Shillong."
    ],
    [
      "Lady Hydari Park",
      "Nature",
      "Walk through landscaped gardens and a small zoo area."
    ],
    [
      "Mawphlang Sacred Forest",
      "Nature",
      "Explore the protected forest with a local guide."
    ],
    [
      "Mawsynram Excursion",
      "Nature",
      "Take a day excursion to the famously rainy landscape."
    ],
    [
      "Sohra (Cherrapunji) Excursion",
      "Nature",
      "Explore waterfalls, caves and dramatic landscapes."
    ],
    [
      "Nohkalikai Falls",
      "Nature",
      "Visit the spectacular waterfall near Sohra."
    ],
    [
      "Mawsmai Cave",
      "Adventure",
      "Explore the limestone cave near Sohra."
    ],
    [
      "Dawki and Umngot River",
      "Adventure",
      "Take a longer excursion for clear river scenery when conditions allow."
    ]
  ],
  "Srinagar": [
    [
      "Dal Lake",
      "Nature",
      "Enjoy the iconic lake scenery and waterfront atmosphere."
    ],
    [
      "Mughal Gardens",
      "Heritage",
      "Explore Srinagar's historic landscaped gardens."
    ],
    [
      "Shankaracharya Temple",
      "Heritage",
      "See the hilltop temple and city views."
    ],
    [
      "Old Srinagar",
      "Culture",
      "Walk through historic neighbourhoods and local markets."
    ],
    [
      "Nishat Bagh",
      "Heritage",
      "Explore the Mughal garden beside Dal Lake."
    ],
    [
      "Shalimar Bagh",
      "Heritage",
      "Visit the historic Mughal garden and terraces."
    ],
    [
      "Chashme Shahi",
      "Heritage",
      "See the terraced garden and spring-fed channels."
    ],
    [
      "Pari Mahal",
      "Heritage",
      "Enjoy hilltop views over Dal Lake and the city."
    ],
    [
      "Hazratbal Shrine",
      "Heritage",
      "Visit the prominent shrine beside Dal Lake."
    ],
    [
      "Shikara Ride",
      "Nature",
      "Take a traditional boat ride on Dal Lake with an operator."
    ],
    [
      "Floating Vegetable Market",
      "Culture",
      "See the early-morning lake market when operating."
    ],
    [
      "Nigeen Lake",
      "Nature",
      "Enjoy a quieter lake setting away from central Dal Lake."
    ],
    [
      "Doodhpathri",
      "Nature",
      "Take a mountain meadow excursion when roads permit."
    ],
    [
      "Gulmarg Excursion",
      "Adventure",
      "Take a day trip for mountain scenery and seasonal activities."
    ],
    [
      "Pahalgam Excursion",
      "Nature",
      "Take a day excursion into the Lidder Valley."
    ]
  ],
  "Visakhapatnam": [
    [
      "RK Beach",
      "Beach",
      "Relax on the city's popular waterfront."
    ],
    [
      "Kailasagiri",
      "Nature",
      "Enjoy elevated coastal and city views."
    ],
    [
      "Submarine Museum",
      "Heritage",
      "Explore a unique naval museum on the waterfront."
    ],
    [
      "Yarada Beach",
      "Beach",
      "Take a quieter coastal outing with scenic surroundings."
    ],
    [
      "Rushikonda Beach",
      "Beach",
      "Enjoy a popular beach with coastal views."
    ],
    [
      "Simhachalam Temple",
      "Heritage",
      "Visit the historic hill temple and its architecture."
    ],
    [
      "Borra Caves Excursion",
      "Nature",
      "Explore the dramatic caves in the nearby Araku region."
    ],
    [
      "Araku Valley Excursion",
      "Nature",
      "Take a mountain excursion into the Eastern Ghats."
    ],
    [
      "Kambalakonda Wildlife Sanctuary",
      "Nature",
      "Explore a protected forest area near the city."
    ],
    [
      "Dolphin's Nose",
      "Nature",
      "See the prominent coastal viewpoint and harbour area."
    ],
    [
      "Visakha Museum",
      "Culture",
      "Explore maritime and local-history exhibits."
    ],
    [
      "INS Kurusura Submarine Museum",
      "Heritage",
      "Tour the preserved submarine museum on RK Beach."
    ],
    [
      "Thotlakonda Buddhist Complex",
      "Heritage",
      "Explore the ancient Buddhist archaeological site."
    ],
    [
      "Bavikonda Buddhist Complex",
      "Heritage",
      "Visit the hilltop Buddhist archaeological remains."
    ],
    [
      "VUDA Park",
      "Nature",
      "Relax in the seafront park and recreational area."
    ]
  ]
};

function canonicalCategory(value) {
  const aliases = {
    beach: "Beach", beaches: "Beach", nature: "Nature", heritage: "Heritage",
    adventure: "Adventure", culture: "Culture", food: "Food", city: "City",
    shopping: "Shopping", hills: "Hills", relax: "Relax", family: "Family"
  };
  const raw = String(value || "").trim();
  return aliases[raw.toLowerCase()] || raw || "Attraction";
}

function normalizePlace(p) {
  return {
    id: p.id,
    name: p.name || "Local attraction",
    category: canonicalCategory(p.category),
    description: p.description || "Explore this destination highlight.",
    latitude: Number(p.latitude ?? p.lat ?? 0),
    longitude: Number(p.longitude ?? p.lng ?? 0),
    entry_fee: Number(p.entry_fee || 0),
    emoji: p.emoji || INTEREST_ICONS[canonicalCategory(p.category)] || "📍"
  };
}

function dateAdd(date, offset) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function dayLabel(date, language) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN",
    { weekday: "short", day: "numeric", month: "short" }
  );
}

function estimateDuration(category, pace) {
  const base = { Heritage: 2, Nature: 2, Beach: 2, Adventure: 3, Culture: 1.75, Food: 1.5, Shopping: 1.5, Hills: 2, City: 1.75, Attraction: 2 };
  let hours = base[category] || 2;
  if (pace === "Relaxed") hours = Math.min(hours + 0.5, 3);
  if (pace === "Packed") hours = Math.max(hours - 0.5, 1);
  return hours;
}

function choosePlaces(destinationName, places, interests) {
  const requested = (interests || []).map(canonicalCategory);
  const source = places.length ? places : (FALLBACK_EXPERIENCES[destinationName] || []).map((x, i) => ({
    id: `fallback-${i}`,
    name: x[0], category: x[1], description: x[2], latitude: 0, longitude: 0, entry_fee: 0,
    emoji: INTEREST_ICONS[x[1]] || "📍"
  }));
  return [...source].sort((a, b) => {
    const ai = requested.includes(canonicalCategory(a.category)) ? 0 : 1;
    const bi = requested.includes(canonicalCategory(b.category)) ? 0 : 1;
    return ai - bi;
  });
}

function normalizePlaceKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildCandidatePlaces(destinationName, places) {
  // Prefer verified Supabase places, but supplement them with the curated
  // 15-place local catalogue when the database has fewer records.
  const dbPlaces = Array.isArray(places) ? places.map(normalizePlace) : [];
  const fallbackPlaces = (FALLBACK_EXPERIENCES[destinationName] || []).map((x, i) => ({
    id: `fallback-${normalizePlaceKey(destinationName)}-${i}`,
    name: x[0],
    category: canonicalCategory(x[1]),
    description: x[2],
    latitude: 0,
    longitude: 0,
    entry_fee: 0,
    emoji: INTEREST_ICONS[canonicalCategory(x[1])] || "📍"
  }));

  const merged = [...dbPlaces, ...fallbackPlaces];
  const seen = new Set();
  return merged.filter(place => {
    const key = normalizePlaceKey(place.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function getCostProfile(stay, pace, people) {
  const stayRates = {
    Budget: { stay: 900, food: 450, transport: 220 },
    "Mid-range": { stay: 1650, food: 750, transport: 350 },
    Premium: { stay: 3600, food: 1400, transport: 650 }
  };
  const paceMultiplier = { Relaxed: 0.90, Balanced: 1, Packed: 1.15 }[pace] || 1;
  const base = stayRates[stay] || stayRates["Mid-range"];
  const sharingFactor = people >= 2 ? 0.88 : 1;

  return {
    stayPerPersonNight: Math.round(base.stay * sharingFactor),
    foodPerPersonDay: Math.round(base.food * paceMultiplier),
    transportPerPersonDay: Math.round(base.transport * paceMultiplier),
    paceMultiplier,
    people
  };
}

function getActivityCostPerPerson(place, pace) {
  const category = canonicalCategory(place.category);
  const fee = Math.max(0, Number(place.entry_fee || 0));
  const incidental = {
    Adventure: 250,
    Food: 120,
    Shopping: 150,
    Beach: 80,
    Nature: 60,
    Heritage: 40,
    Culture: 50,
    Hills: 80,
    City: 40,
    Family: 100,
    Relax: 40
  }[category] || 40;
  const paceFactor = pace === "Packed" ? 1.08 : pace === "Relaxed" ? 0.95 : 1;
  return Math.round(fee + incidental * paceFactor);
}

function buildBudgetWarning(totalBudget, estimatedTotal, people, days) {
  const perPersonBudget = people ? totalBudget / people : totalBudget;
  const perPersonEstimate = people ? estimatedTotal / people : estimatedTotal;
  const ratio = perPersonBudget > 0 ? perPersonEstimate / perPersonBudget : Infinity;

  if (!Number.isFinite(ratio) || perPersonBudget <= 0) {
    return { status: "invalid", level: "danger", message: "Enter a positive budget per person." };
  }
  if (ratio > 1.15) {
    return {
      status: "over",
      level: "danger",
      message: `Estimated local trip cost is about ₹${Math.round(perPersonEstimate).toLocaleString()} per person for ${days} day(s), above your ₹${Math.round(perPersonBudget).toLocaleString()} budget.`
    };
  }
  if (ratio > 0.90) {
    return {
      status: "tight",
      level: "warning",
      message: `Your budget is tight. Estimated cost is about ₹${Math.round(perPersonEstimate).toLocaleString()} per person, leaving only a small buffer.`
    };
  }
  return {
    status: "within",
    level: "ok",
    message: `Your ₹${Math.round(perPersonBudget).toLocaleString()} per-person budget has an estimated local-trip cost of about ₹${Math.round(perPersonEstimate).toLocaleString()} per person, including buffer.`
  };
}

function buildFallbackItinerary({ destination, places, days, budget, interests, pace, stay, startDate, weather, language, travellerCount = 1 }) {
  // Deterministic planner: verified Supabase places + curated local catalogue + live weather.
  // `budget` is the user's budget PER PERSON. The planner calculates the party total separately.
  const selected = buildCandidatePlaces(destination.name, places);
  const targetPerDay = pace === "Packed" ? 4 : pace === "Relaxed" ? 2 : 3;
  const slots = [
    ["09:00", "Morning"],
    ["13:30", "Afternoon"],
    ["17:30", "Evening"],
    ["19:30", "Evening"]
  ];
  const people = Math.min(Math.max(Number(travellerCount) || 1, 1), 10);
  const profile = getCostProfile(stay, pace, people);
  const itinerary = [];
  const usedAcrossTrip = new Set();
  let cursor = 0;
  const requested = (interests || []).map(canonicalCategory);
  const ranked = [
    ...selected.filter(p => requested.includes(canonicalCategory(p.category))),
    ...selected.filter(p => !requested.includes(canonicalCategory(p.category)))
  ];

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const date = dateAdd(startDate, dayIndex);
    const forecast = weather.find(w => w.date === date) || null;
    const rainy = forecast && Number(forecast.rainChance) >= 60;
    const dayItems = [];
    const usedToday = new Set();
    const count = Math.min(targetPerDay, Math.max(2, ranked.length || 2));

    for (let slotIndex = 0; slotIndex < count; slotIndex++) {
      let available = ranked.filter(p => {
        const key = normalizePlaceKey(p.name);
        return key && !usedToday.has(key) && !usedAcrossTrip.has(key);
      });
      if (!available.length) available = ranked.filter(p => !usedToday.has(normalizePlaceKey(p.name)));
      if (!available.length) break;

      let place = null;
      if (rainy && slotIndex >= 1) {
        place = available.find(p => ["Heritage", "Culture", "Food", "Shopping"].includes(canonicalCategory(p.category)));
      }
      place = place || available[cursor % available.length];
      cursor += 1;

      const key = normalizePlaceKey(place.name);
      usedToday.add(key);
      usedAcrossTrip.add(key);
      const category = canonicalCategory(place.category);
      const duration = estimateDuration(category, pace);
      const fee = Math.max(0, Number(place.entry_fee || 0));
      const activityCostPerPerson = getActivityCostPerPerson(place, pace);
      const extra = fee ? ` Verified entry fee approx. ₹${fee.toLocaleString()} per person.` : " No verified entry fee is listed.";
      const weatherNote = rainy && slotIndex >= 1
        ? "Rain-aware timing: keep this activity flexible and carry rain protection."
        : "Best planned within this time window for a comfortable day.";

      dayItems.push({
        time: slots[slotIndex][0],
        period: slots[slotIndex][1],
        place: place.name,
        category,
        icon: place.emoji || INTEREST_ICONS[category] || "📍",
        note: `${place.description || "Explore this destination highlight."}${extra} ${weatherNote}`,
        durationHours: duration,
        entryFeePerPerson: fee,
        estimatedCost: fee
      });
    }

    const totalHours = Number(dayItems.reduce((sum, x) => sum + Number(x.durationHours || 0), 0).toFixed(1));
    const entryFeesPerPerson = dayItems.reduce((sum, x) => sum + Number(x.entryFeePerPerson || 0), 0);
    const activityExtrasPerPerson = dayItems.reduce((sum, x) => sum + Math.max(0, getActivityCostPerPerson({ category: x.category, entry_fee: x.entryFeePerPerson }, pace) - x.entryFeePerPerson), 0);

    // A 3-day trip normally means 2 hotel nights. The final day has no new night.
    const nightsForDay = dayIndex < Math.max(days - 1, 0) ? 1 : 0;
    const stayPerPerson = profile.stayPerPersonNight * nightsForDay;
    const foodPerPerson = Math.round(profile.foodPerPersonDay * (dayItems.length >= 3 ? 1.05 : 0.96));
    const routeComplexity = dayItems.reduce((sum, item) => {
      const category = canonicalCategory(item.category);
      return sum + (["Adventure", "Nature", "Hills"].includes(category) ? 1.20 : ["Shopping", "Food"].includes(category) ? 0.90 : 1);
    }, 0);
    const transportMultiplier = dayItems.length ? (routeComplexity / dayItems.length) : 1;
    const transportPerPerson = Math.round(profile.transportPerPersonDay * (0.92 + transportMultiplier * 0.12));
    const subtotalPerPerson = stayPerPerson + foodPerPerson + transportPerPerson + entryFeesPerPerson + activityExtrasPerPerson;
    const bufferPerPerson = Math.max(100, Math.round(subtotalPerPerson * 0.10));
    const estimatedSpendPerPerson = subtotalPerPerson + bufferPerPerson;
    const estimatedSpend = estimatedSpendPerPerson * people;

    itinerary.push({
      day: dayIndex + 1,
      date,
      dateLabel: dayLabel(date, language),
      theme: requested.length ? `${pace} ${requested.slice(0, 2).join(" + ")} route` : `${pace} local highlights`,
      weather: forecast,
      estimatedSpend,
      estimatedSpendPerPerson,
      activityFees: entryFeesPerPerson * people,
      budgetAllocation: {
        stay: stayPerPerson * people,
        food: foodPerPerson * people,
        transport: transportPerPerson * people,
        activities: (entryFeesPerPerson + activityExtrasPerPerson) * people,
        buffer: bufferPerPerson * people
      },
      costPerPerson: {
        stay: stayPerPerson,
        food: foodPerPerson,
        transport: transportPerPerson,
        attractionFees: entryFeesPerPerson,
        activities: activityExtrasPerPerson,
        buffer: bufferPerPerson
      },
      totalHours,
      items: dayItems
    });
  }

  const estimatedTotalSpend = itinerary.reduce((sum, day) => sum + Number(day.estimatedSpend || 0), 0);
  const totalBudget = Math.max(0, Number(budget || 0)) * people;
  const warning = buildBudgetWarning(totalBudget, estimatedTotalSpend, people, days);
  const estimatedPerPersonSpend = people ? Math.round(estimatedTotalSpend / people) : estimatedTotalSpend;
  const averageDailyPerPerson = days ? Math.round(estimatedPerPersonSpend / days) : estimatedPerPersonSpend;

  return finalizeItinerary({
    destination,
    days,
    budget,
    totalBudget,
    estimatedTotalSpend,
    estimatedPerPersonSpend,
    estimatedDailyPerPerson: averageDailyPerPerson,
    interests,
    pace,
    stay,
    startDate,
    weather,
    language,
    itinerary,
    travellerCount: people,
    budgetWarning: warning,
    mode: "local"
  });
}

function finalizeItinerary({ destination, days, budget, totalBudget, estimatedTotalSpend, estimatedPerPersonSpend, estimatedDailyPerPerson, interests, pace, stay, startDate, weather, language, itinerary, travellerCount = 1, budgetWarning, mode = "ai" }) {
  const endDate = dateAdd(startDate, days - 1);
  const rainDays = weather.filter(w => w.date >= startDate && w.date <= endDate && Number(w.rainChance) >= 60).length;
  return {
    destination: destination.name,
    destinationId: destination.id,
    startDate,
    endDate,
    days,
    // Backward-compatible meaning: budget is the user's budget per person.
    budget: Number(budget || 0),
    totalBudget: Number(totalBudget || 0),
    estimatedTotalSpend: Number(estimatedTotalSpend || 0),
    estimatedPerPersonSpend: Number(estimatedPerPersonSpend || 0),
    estimatedDailySpend: Number(estimatedDailyPerPerson || 0),
    pace,
    stay,
    interests: interests || [],
    travellers: "",
    travellerCount,
    weatherAware: true,
    rainDays,
    weatherSource: weather.length ? "Open-Meteo" : "Unavailable",
    aiProvider: "TRIPAN Local Planner",
    aiModel: null,
    generationMode: mode,
    budgetWarning: budgetWarning || null,
    itinerary,
    generatedAt: new Date().toISOString()
  };
}

async function getPlacesForDestination(destinationId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("places")
    .select("id,destination_id,name,category,description,latitude,longitude,entry_fee,image_url")
    .eq("destination_id", destinationId)
    .limit(50);
  if (error) throw error;
  return (data || []).map(normalizePlace);
}

app.post("/api/itinerary", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase is not configured" });
    const { destination: destinationId, days, budget, interests = [], travellers = "", travellerCount = 1, pace = "Balanced", stay = "Mid-range", startDate, language = "en" } = req.body || {};
    if (!destinationId || !startDate) return res.status(400).json({ error: "Destination and departure date are required" });

    const tripDays = Math.min(Math.max(Number(days) || 1, 1), 7);
    const tripBudget = Math.max(Number(budget) || 0, 0);
    const people = Math.min(Math.max(Number(travellerCount) || 1, 1), 10);
    const destination = await getDestination(destinationId);
    if (!destination) return res.status(404).json({ error: "Destination not found" });

    const [places, weatherResponse] = await Promise.all([
      getPlacesForDestination(destinationId).catch(error => {
        console.warn("Planner places fallback:", error.message);
        return [];
      }),
      getWeather(destination.latitude, destination.longitude, startDate, tripDays).catch(() => null)
    ]);

    const weather = weatherResponse
      ? (weatherResponse.daily?.time || []).map((date, i) => ({
          date,
          max: Math.round(weatherResponse.daily.temperature_2m_max[i]),
          min: Math.round(weatherResponse.daily.temperature_2m_min[i]),
          rainChance: weatherResponse.daily.precipitation_probability_max?.[i] ?? 0,
          code: weatherResponse.daily.weather_code[i],
          condition: weatherCondition(weatherResponse.daily.weather_code[i])
        }))
      : [];

    const result = buildFallbackItinerary({
      destination,
      places,
      days: tripDays,
      budget: tripBudget,
      interests,
      pace,
      stay,
      startDate,
      weather,
      language,
      travellerCount: people
    });
    result.travellers = travellers;
    result.travellerCount = people;
    result.budgetPerPerson = tripBudget;
    result.weatherSource = weather.length ? "Open-Meteo" : "Unavailable";
    res.json(result);
  } catch (error) {
    console.error("POST /api/itinerary:", error);
    res.status(500).json({ error: "Could not generate itinerary", details: error.message });
  }
});

app.post("/api/recommendations", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase is not configured" });
    const { destination: destinationId, interests = [], budget = 0, language = "en" } = req.body || {};
    const destination = await getDestination(destinationId);
    if (!destination) return res.status(404).json({ error: "Destination not found" });
    const places = await getPlacesForDestination(destinationId).catch(error => {
      console.warn("Recommendation places fallback:", error.message);
      return [];
    });
    const requested = interests.map(canonicalCategory);
    const ranked = places.map(p => {
      const match = requested.includes(canonicalCategory(p.category));
      return { p, score: match ? 98 : 78 };
    }).sort((a, b) => b.score - a.score).slice(0, 6);
    const names = ranked.map(x => x.p.name);
    const reason = requested.length
      ? `Matched ${requested.join(", ")} interests with highlights in ${destination.name}. Budget context: ₹${Number(budget || 0).toLocaleString()}.`
      : `A balanced set of highlights for ${destination.name}, ready to fit your selected pace and budget.`;
    res.json({ destination: destination.name, reason, recommendations: ranked.map(x => ({
      name: x.p.name,
      type: canonicalCategory(x.p.category),
      icon: x.p.emoji || INTEREST_ICONS[canonicalCategory(x.p.category)] || "📍",
      score: x.score,
      description: x.p.description
    })) });
  } catch (error) {
    console.error("POST /api/recommendations:", error);
    res.status(500).json({ error: "Could not load recommendations", details: error.message });
  }
});

/* -------------------- AUTH --------------------
   V7 keeps the existing local JWT auth for compatibility.
   Supabase Auth migration can be done after the data layer is verified.
------------------------------------------------ */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const db = readDB();
    const normalizedEmail = String(email).trim().toLowerCase();

    if (db.users.some(u => u.email === normalizedEmail)) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const user = {
      id: id(),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(String(password), 12),
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    writeDB(db);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: isAdminUser(user)
    };
    res.status(201).json({
      user: safeUser,
      token: authToken(safeUser)
    });
  } catch (error) {
    console.error("POST /api/auth/register:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const db = readDB();

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = db.users.find(u => u.email === normalizedEmail);

    if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: isAdminUser(user)
    };

    res.json({
      user: safeUser,
      token: authToken(safeUser)
    });
  } catch (error) {
    console.error("POST /api/auth/login:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", auth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.sub);

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: isAdminUser(user)
  });
});


/* -------------------- FAVORITES -------------------- */
app.get("/api/favorites", auth, async (req, res) => {
  try {
    const db = readDB();
    const ids = db.favorites.filter(f => f.userId === req.user.sub).map(f => f.destinationId);
    if (!ids.length) return res.json([]);

    const destinations = await getDestinations("en");
    const out = destinations.filter(d => ids.includes(d.id)).map(d => ({
      id: d.id,
      name: d.name,
      state: d.state,
      country: d.country,
      description: d.description,
      image: d.image,
      emoji: d.emoji,
      rating: d.rating
    }));
    res.json(out);
  } catch (error) {
    console.error("GET /api/favorites:", error);
    res.status(500).json({ error: "Could not load favorites" });
  }
});

app.post("/api/favorites/:id", auth, async (req, res) => {
  try {
    const destination = await getDestination(req.params.id);
    if (!destination) return res.status(404).json({ error: "Destination not found" });

    const db = readDB();
    db.favorites = Array.isArray(db.favorites) ? db.favorites : [];
    const exists = db.favorites.some(f => f.userId === req.user.sub && f.destinationId === destination.id);
    if (!exists) {
      db.favorites.push({
        id: id(),
        userId: req.user.sub,
        destinationId: destination.id,
        createdAt: new Date().toISOString()
      });
      writeDB(db);
    }
    res.json({ ok: true, saved: true });
  } catch (error) {
    console.error("POST /api/favorites/:id:", error);
    res.status(500).json({ error: "Could not update favorite" });
  }
});

app.delete("/api/favorites/:id", auth, async (req, res) => {
  try {
    const db = readDB();
    const before = db.favorites.length;
    db.favorites = db.favorites.filter(
      f => !(f.userId === req.user.sub && f.destinationId === req.params.id)
    );
    if (db.favorites.length !== before) writeDB(db);
    res.json({ ok: true, saved: false });
  } catch (error) {
    console.error("DELETE /api/favorites/:id:", error);
    res.status(500).json({ error: "Could not update favorite" });
  }
});

/* -------------------- TRIPS -------------------- */

app.get("/api/trips", auth, (req, res) => {
  const db = readDB();
  res.json(db.trips.filter(t => t.userId === req.user.sub));
});

app.post("/api/trips", auth, (req, res) => {
  const db = readDB();

  const trip = {
    id: id(),
    userId: req.user.sub,
    ...req.body,
    createdAt: new Date().toISOString()
  };

  db.trips.push(trip);
  writeDB(db);

  res.status(201).json(trip);
});

app.delete("/api/trips/:id", auth, (req, res) => {
  const db = readDB();
  const before = db.trips.length;

  db.trips = db.trips.filter(
    t => !(t.id === req.params.id && t.userId === req.user.sub)
  );

  if (db.trips.length === before) {
    return res.status(404).json({ error: "Trip not found" });
  }

  writeDB(db);
  res.json({ ok: true });
});


/* -------------------- FEEDBACK / ADMIN -------------------- */

app.post("/api/feedback", auth, (req, res) => {
  try {
    const rating = Math.min(5, Math.max(1, Number(req.body.rating) || 0));
    const message = String(req.body.message || "").trim();
    if (!rating || !message) return res.status(400).json({ error: "Rating and feedback are required" });

    const db = readDB();
    db.feedback = Array.isArray(db.feedback) ? db.feedback : [];
    const entry = {
      id: id(),
      userId: req.user.sub,
      rating,
      message: message.slice(0, 2000),
      createdAt: new Date().toISOString()
    };
    db.feedback.push(entry);
    writeDB(db);
    res.status(201).json({ ok: true, feedback: entry });
  } catch (error) {
    console.error("POST /api/feedback:", error);
    res.status(500).json({ error: "Could not save feedback" });
  }
});

app.get("/api/admin/stats", auth, adminAuth, (req, res) => {
  const db = readDB();
  const trips = Array.isArray(db.trips) ? db.trips : [];
  const favorites = Array.isArray(db.favorites) ? db.favorites : [];
  const feedback = Array.isArray(db.feedback) ? db.feedback : [];

  const counts = new Map();
  for (const trip of trips) {
    const name = String(trip.destination || "Unknown");
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  const topDestinations = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  res.json({
    users: Array.isArray(db.users) ? db.users.length : 0,
    trips: trips.length,
    favorites: favorites.length,
    feedback: feedback.length,
    topDestinations
  });
});

/* -------------------- STATIC -------------------- */

app.use(express.static(publicDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`TRIPAN V10 running at http://localhost:${PORT}`);
  console.log(`Supabase: ${supabase ? "configured" : "NOT configured"}`);
  console.log(`Admin: ${ADMIN_EMAILS.length ? "configured" : "NOT configured (set ADMIN_EMAIL or ADMIN_EMAILS)"}`);
});

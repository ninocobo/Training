require("dotenv").config();
const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error("Falta la variable de entorno DATABASE_URL (cadena de conexion de Neon).");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      day TEXT NOT NULL,
      date DATE NOT NULL,
      exercises JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS sessions_day_date_idx ON sessions (day, date DESC);
  `);
}

function toClient(row) {
  return {
    id: row.id,
    day: row.day,
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10),
    exercises: row.exercises,
    updatedAt: row.updated_at
  };
}

const FRONTEND_DIST = path.join(__dirname, "frontend", "dist", "frontend", "browser");

app.use(express.json());
app.use(express.static(FRONTEND_DIST));

app.get("/api/session/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, day, date, exercises, updated_at FROM sessions WHERE id = $1",
      [req.params.id]
    );
    res.json(rows.length ? toClient(rows[0]) : null);
  } catch (err) {
    console.error("GET /api/session/:id", err);
    res.status(500).json({ error: "db_error" });
  }
});

app.put("/api/session/:id", async (req, res) => {
  const { day, date, exercises } = req.body || {};
  if (!day || !date || typeof exercises !== "object" || exercises === null) {
    return res.status(400).json({ error: "invalid_body" });
  }
  try {
    await pool.query(
      `INSERT INTO sessions (id, day, date, exercises, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (id) DO UPDATE
       SET day = EXCLUDED.day, date = EXCLUDED.date, exercises = EXCLUDED.exercises, updated_at = now()`,
      [req.params.id, day, date, JSON.stringify(exercises)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/session/:id", err);
    res.status(500).json({ error: "db_error" });
  }
});

app.get("/api/previous", async (req, res) => {
  const day = req.query.day;
  const exclude = req.query.exclude || "";
  if (!day) return res.status(400).json({ error: "missing_day" });
  try {
    const { rows } = await pool.query(
      `SELECT id, day, date, exercises, updated_at FROM sessions
       WHERE day = $1 AND id != $2
       ORDER BY date DESC LIMIT 1`,
      [day, exclude]
    );
    res.json(rows.length ? toClient(rows[0]) : null);
  } catch (err) {
    console.error("GET /api/previous", err);
    res.status(500).json({ error: "db_error" });
  }
});

ensureSchema()
  .then(() => {
    app.listen(port, () => console.log("Rutina Gluteo escuchando en el puerto " + port));
  })
  .catch((err) => {
    console.error("No se pudo inicializar la base de datos", err);
    process.exit(1);
  });

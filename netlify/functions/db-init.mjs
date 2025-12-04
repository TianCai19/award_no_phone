import { neon } from "@netlify/neon";

export default async (req, context) => {
  const sql = neon();

  try {
    // Create the study_records table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS study_records (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        total_seconds INTEGER NOT NULL DEFAULT 0,
        best_streak_seconds INTEGER NOT NULL DEFAULT 0,
        sessions_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index on date for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_study_records_date ON study_records(date)
    `;

    return new Response(JSON.stringify({
      success: true,
      message: "Database initialized successfully"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/db-init"
};

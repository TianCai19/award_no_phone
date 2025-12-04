import { neon } from "@netlify/neon";

export default async (req, context) => {
  const sql = neon();

  if (req.method === "POST") {
    // Record study time
    try {
      const body = await req.json();
      const { date, seconds, best_streak } = body;

      if (!date || typeof seconds !== "number") {
        return new Response(JSON.stringify({
          success: false,
          error: "Missing required fields: date, seconds"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Upsert: insert or update if date exists
      const result = await sql`
        INSERT INTO study_records (date, total_seconds, best_streak_seconds, sessions_count, updated_at)
        VALUES (${date}, ${seconds}, ${best_streak || 0}, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (date) DO UPDATE SET
          total_seconds = study_records.total_seconds + ${seconds},
          best_streak_seconds = GREATEST(study_records.best_streak_seconds, ${best_streak || 0}),
          sessions_count = study_records.sessions_count + 1,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      return new Response(JSON.stringify({
        success: true,
        data: result[0]
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error recording study time:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  } else if (req.method === "GET") {
    // Get study records
    try {
      const url = new URL(req.url);
      const date = url.searchParams.get("date");
      const range = url.searchParams.get("range"); // "week", "month", "all"

      let result;

      if (date) {
        // Get specific date
        result = await sql`
          SELECT * FROM study_records WHERE date = ${date}
        `;
      } else if (range === "week") {
        // Get last 7 days
        result = await sql`
          SELECT * FROM study_records
          WHERE date >= CURRENT_DATE - INTERVAL '7 days'
          ORDER BY date DESC
        `;
      } else if (range === "month") {
        // Get last 30 days
        result = await sql`
          SELECT * FROM study_records
          WHERE date >= CURRENT_DATE - INTERVAL '30 days'
          ORDER BY date DESC
        `;
      } else {
        // Get all records (limited to last 90 days)
        result = await sql`
          SELECT * FROM study_records
          WHERE date >= CURRENT_DATE - INTERVAL '90 days'
          ORDER BY date DESC
        `;
      }

      // Calculate summary statistics
      const summary = await sql`
        SELECT
          COALESCE(SUM(total_seconds), 0) as all_time_seconds,
          COALESCE(MAX(best_streak_seconds), 0) as best_streak_ever,
          COALESCE(SUM(sessions_count), 0) as total_sessions,
          COUNT(*) as days_practiced
        FROM study_records
      `;

      return new Response(JSON.stringify({
        success: true,
        data: result,
        summary: summary[0]
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error fetching study records:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  } else {
    return new Response(JSON.stringify({
      success: false,
      error: "Method not allowed"
    }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/study-records"
};

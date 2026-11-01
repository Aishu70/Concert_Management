
import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET() {
  try {
    const [concerts] = await pool.execute(`
      SELECT
        c.concert_id AS id,
        c.concert_name AS name,
        c.concert_date AS date,
        c.start_time AS start_time,
        c.end_time AS end_time,
        c.status AS status,

        v.venue_name AS venue,
        v.city AS city,

        COALESCE(
          (
            SELECT GROUP_CONCAT(
              DISTINCT a.artist_name
              SEPARATOR ', '
            )
            FROM Performance p
            INNER JOIN Artist a
              ON p.artist_id = a.artist_id
            WHERE p.concert_id = c.concert_id
          ),
          'Artist information unavailable'
        ) AS artist,

        COALESCE(
          (
            SELECT MIN(tt.price)
            FROM Ticket t
            INNER JOIN TicketType tt
              ON t.ticket_type_id = tt.ticket_type_id
            WHERE t.concert_id = c.concert_id
          ),
          0
        ) AS price

      FROM Concert c

      INNER JOIN Venue v
        ON c.venue_id = v.venue_id

      ORDER BY c.concert_date ASC
    `);

    return NextResponse.json({
      success: true,
      count: concerts.length,
      data: concerts,
    });
  } catch (error) {
    console.error("Concert API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve concerts.",
      },
      { status: 500 }
    );
  }
}

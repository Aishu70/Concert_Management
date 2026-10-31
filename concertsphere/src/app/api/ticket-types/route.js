import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const concertId = Number(searchParams.get("concertId"));

    if (!concertId || !Number.isInteger(concertId)) {
      return NextResponse.json(
        { success: false, message: "A valid concertId is required." },
        { status: 400 }
      );
    }

    const [ticketTypes] = await pool.execute(
      `
      SELECT
        tt.ticket_type_id AS id,
        tt.type_name AS name,
        tt.price AS price,
        tt.description AS description,
        COUNT(t.ticket_id) AS total_tickets,
        SUM(
          CASE
            WHEN t.ticket_status = 'AVAILABLE' THEN 1
            ELSE 0
          END
        ) AS available_tickets
      FROM TicketType tt
      INNER JOIN Ticket t
        ON t.ticket_type_id = tt.ticket_type_id
      WHERE t.concert_id = ?
      GROUP BY
        tt.ticket_type_id,
        tt.type_name,
        tt.price,
        tt.description
      ORDER BY tt.price ASC
      `,
      [concertId]
    );

    return NextResponse.json({
      success: true,
      data: ticketTypes,
    });
  } catch (error) {
    console.error("Ticket types API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve ticket types." },
      { status: 500 }
    );
  }
}
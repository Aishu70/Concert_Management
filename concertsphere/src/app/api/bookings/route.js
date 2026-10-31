import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function POST(request) {
  let connection;

  try {
    const body = await request.json();
    const customerId = Number(body.customerId);
    const concertId = Number(body.concertId);
    const ticketTypeId = Number(body.ticketTypeId);
    const quantity = Number(body.quantity);

    if (
      !Number.isInteger(customerId) ||
      !Number.isInteger(concertId) ||
      !Number.isInteger(ticketTypeId) ||
      !Number.isInteger(quantity) ||
      customerId <= 0 ||
      concertId <= 0 ||
      ticketTypeId <= 0 ||
      quantity <= 0 ||
      quantity > 6
    ) {
      return NextResponse.json(
        { success: false, message: "Please provide valid booking details." },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Lock available tickets so two requests cannot book the same ticket.
    const [tickets] = await connection.execute(
      `SELECT t.ticket_id, tt.price
       FROM Ticket t
       JOIN TicketType tt ON t.ticket_type_id = tt.ticket_type_id
       WHERE t.concert_id = ?
         AND t.ticket_type_id = ?
         AND t.ticket_status = 'AVAILABLE'
       ORDER BY t.ticket_id
       LIMIT ?
       FOR UPDATE`,
      [concertId, ticketTypeId, quantity]
    );

    if (tickets.length < quantity) {
      await connection.rollback();

      return NextResponse.json(
        {
          success: false,
          message: `Only ${tickets.length} ticket(s) are currently available.`,
        },
        { status: 409 }
      );
    }

    const [bookingResult] = await connection.execute(
      `INSERT INTO Booking (customer_id, booking_status)
       VALUES (?, 'PENDING')`,
      [customerId]
    );

    const bookingId = bookingResult.insertId;
    const price = Number(tickets[0].price);

    for (const ticket of tickets) {
      await connection.execute(
        `INSERT INTO BookingItem
         (booking_id, ticket_id, quantity, price_at_booking)
         VALUES (?, ?, 1, ?)`,
        [bookingId, ticket.ticket_id, price]
      );
    }

    const ticketIds = tickets.map((ticket) => ticket.ticket_id);
    const placeholders = ticketIds.map(() => "?").join(",");

    await connection.execute(
      `UPDATE Ticket
       SET ticket_status = 'SOLD'
       WHERE ticket_id IN (${placeholders})`,
      ticketIds
    );

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully.",
        bookingId,
        quantity,
        totalAmount: price * quantity,
        bookingStatus: "PENDING",
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Booking API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create booking." },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
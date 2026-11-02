
import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export async function GET(request) {
  const customerId = Number(request.nextUrl.searchParams.get("customerId"));

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json(
      { success: false, message: "Provide a valid customer ID." },
      { status: 400 }
    );
  }

  try {
    const [bookings] = await pool.execute(
      `SELECT
         b.booking_id AS id,
        b.customer_id AS customerId,
        c.concert_name AS concert,
         tt.type_name AS ticket,
         SUM(bi.quantity) AS quantity,
         SUM(bi.quantity * bi.price_at_booking) AS total,
         b.booking_status AS status
       FROM Booking b
       JOIN BookingItem bi ON bi.booking_id = b.booking_id
       JOIN Ticket t ON t.ticket_id = bi.ticket_id
       JOIN Concert c ON c.concert_id = t.concert_id
       JOIN TicketType tt ON tt.ticket_type_id = t.ticket_type_id
       WHERE b.customer_id = ?
       GROUP BY
         b.booking_id,
         b.customer_id,
         c.concert_name,
         tt.type_name,
         b.booking_status
       ORDER BY b.booking_id DESC`,
      [customerId]
    );

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Booking retrieval API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve bookings." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let connection;
  let transactionStarted = false;

  try {
    const body = await request.json();

    const customerId = Number(body.customerId);
    const concertId = Number(body.concertId);
    const ticketTypeId = Number(body.ticketTypeId);
    const quantity = Number(body.quantity);

    // Validate booking details.
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
        {
          success: false,
          message: "Please provide valid booking details.",
        },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Check whether the customer exists.
    const [customers] = await connection.execute(
      `SELECT customer_id
       FROM Customer
       WHERE customer_id = ?`,
      [customerId]
    );

    if (customers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found. Please enter a valid customer ID.",
        },
        { status: 404 }
      );
    }

    await connection.beginTransaction();
    transactionStarted = true;

    // Lock available tickets to prevent simultaneous bookings
    // from selecting the same tickets.
    const [tickets] = await connection.execute(
      `SELECT t.ticket_id, tt.price
       FROM Ticket t
       JOIN TicketType tt
         ON t.ticket_type_id = tt.ticket_type_id
       WHERE t.concert_id = ?
         AND t.ticket_type_id = ?
         AND t.ticket_status = 'AVAILABLE'
       ORDER BY t.ticket_id
       LIMIT ?
       FOR UPDATE`,
      [concertId, ticketTypeId, quantity]
    );

    // Check whether enough tickets are available.
    if (tickets.length < quantity) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        {
          success: false,
          message: `Only ${tickets.length} ticket(s) are currently available.`,
        },
        { status: 409 }
      );
    }

    // Create the booking with PENDING status.
    const [bookingResult] = await connection.execute(
      `INSERT INTO Booking (customer_id, booking_status)
       VALUES (?, 'PENDING')`,
      [customerId]
    );

    const bookingId = bookingResult.insertId;

    // Create one booking item for each selected ticket.
    let totalAmount = 0;

    for (const ticket of tickets) {
      const price = Number(ticket.price);
      totalAmount += price;

      await connection.execute(
        `INSERT INTO BookingItem
         (booking_id, ticket_id, quantity, price_at_booking)
         VALUES (?, ?, 1, ?)`,
        [bookingId, ticket.ticket_id, price]
      );
    }

    // Mark the selected tickets as SOLD.
    const ticketIds = tickets.map((ticket) => ticket.ticket_id);
    const placeholders = ticketIds.map(() => "?").join(",");

    await connection.execute(
      `UPDATE Ticket
       SET ticket_status = 'SOLD'
       WHERE ticket_id IN (${placeholders})`,
      ticketIds
    );

    // Save all booking changes together.
    await connection.commit();
    transactionStarted = false;

    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully.",
        bookingId,
        quantity,
        totalAmount,
        bookingStatus: "PENDING",
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
    }

    console.error("Booking API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create booking.",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

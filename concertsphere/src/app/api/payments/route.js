import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

const paymentMethods = new Set(["UPI", "CARD", "NET_BANKING", "CASH"]);

export async function POST(request) {
  let connection;
  let transactionStarted = false;

  try {
    const body = await request.json();
    const bookingId = Number(body?.bookingId);
    const paymentMethod =
      typeof body?.paymentMethod === "string"
        ? body.paymentMethod.trim().toUpperCase()
        : "";
    const transactionId =
      typeof body?.transactionId === "string"
        ? body.transactionId.trim() || null
        : null;

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0 ||
      !paymentMethods.has(paymentMethod) ||
      (transactionId !== null && transactionId.length > 100)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Provide a valid booking, payment method, and transaction ID.",
        },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [bookings] = await connection.execute(
      `SELECT booking_id
       FROM Booking
       WHERE booking_id = ?
       FOR UPDATE`,
      [bookingId]
    );

    if (bookings.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    const [existingPayments] = await connection.execute(
      `SELECT
         payment_id AS paymentId,
         booking_id AS bookingId,
         amount,
         payment_date AS paymentDate,
         payment_method AS paymentMethod,
         payment_status AS paymentStatus,
         transaction_id AS transactionId
       FROM Payment
       WHERE booking_id = ?
       ORDER BY payment_id DESC
       LIMIT 1`,
      [bookingId]
    );

    if (existingPayments.length > 0) {
      await connection.commit();
      transactionStarted = false;
      return NextResponse.json({
        success: true,
        message: "A payment record already exists for this booking.",
        data: existingPayments[0],
      });
    }

    const [amountRows] = await connection.execute(
      `SELECT COALESCE(SUM(price_at_booking * quantity), 0) AS amount
       FROM BookingItem
       WHERE booking_id = ?`,
      [bookingId]
    );
    const amount = Number(amountRows[0].amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      await connection.rollback();
      transactionStarted = false;
      return NextResponse.json(
        {
          success: false,
          message: "This booking has no valid amount to pay.",
        },
        { status: 400 }
      );
    }

    const [insertResult] = await connection.execute(
      `INSERT INTO Payment
         (booking_id, amount, payment_method, transaction_id)
       VALUES (?, ?, ?, ?)`,
      [bookingId, amount, paymentMethod, transactionId]
    );

    const [payments] = await connection.execute(
      `SELECT
         payment_id AS paymentId,
         booking_id AS bookingId,
         amount,
         payment_date AS paymentDate,
         payment_method AS paymentMethod,
         payment_status AS paymentStatus,
         transaction_id AS transactionId
       FROM Payment
       WHERE payment_id = ?`,
      [insertResult.insertId]
    );

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json(
      {
        success: true,
        message: "Payment record saved. No money was charged.",
        data: payments[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
    }

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          message: "That transaction ID is already in use.",
        },
        { status: 409 }
      );
    }

    console.error("Payment API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save the payment record.",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

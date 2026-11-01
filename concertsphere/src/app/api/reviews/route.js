
import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import pool from "@/lib/mysql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const concertId = Number(searchParams.get("concertId"));

    if (!Number.isInteger(concertId) || concertId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid concertId is required.",
        },
        { status: 400 }
      );
    }

    const db = await getMongoDb();

    const reviews = await db
      .collection("reviews")
      .find({ concertId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: reviews.map((review) => ({
        ...review,
        _id: review._id.toString(),
      })),
    });
  } catch (error) {
    console.error("Get reviews error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch reviews.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid review data.",
        },
        { status: 400 }
      );
    }

    const concertId = Number(body.concertId);
    const customerId = Number(body.customerId);
    const rating = Number(body.rating);

    const comment =
      typeof body.comment === "string"
        ? body.comment.trim()
        : "";

    if (
      !Number.isInteger(concertId) ||
      concertId <= 0 ||
      !Number.isInteger(customerId) ||
      customerId <= 0 ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      !comment ||
      comment.length > 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Provide valid concertId, customerId, rating (1–5), and a comment of up to 1000 characters.",
        },
        { status: 400 }
      );
    }

    const [concerts] = await pool.execute(
      `
      SELECT
        TIMESTAMP(concert_date, end_time) <= CURRENT_TIMESTAMP AS hasEnded
      FROM Concert
      WHERE concert_id = ?
      `,
      [concertId]
    );

    if (concerts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Concert not found.",
        },
        { status: 404 }
      );
    }

    if (Number(concerts[0].hasEnded) !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Reviews can only be submitted after the concert has ended.",
        },
        { status: 403 }
      );
    }

    const db = await getMongoDb();

    const review = {
      concertId,
      customerId,
      rating,
      comment,
      createdAt: new Date(),
    };

    const result = await db.collection("reviews").insertOne(review);

    return NextResponse.json(
      {
        success: true,
        message: "Review added successfully.",
        data: {
          ...review,
          _id: result.insertedId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create review error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to add review.",
      },
      { status: 500 }
    );
  }
}

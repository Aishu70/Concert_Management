import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const concertId = Number(searchParams.get("concertId"));

    if (!Number.isInteger(concertId) || concertId <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid concertId is required." },
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
      { success: false, message: "Unable to fetch reviews." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const concertId = Number(body.concertId);
    const customerId = Number(body.customerId);
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    if (
      !Number.isInteger(concertId) ||
      concertId <= 0 ||
      !Number.isInteger(customerId) ||
      customerId <= 0 ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      !comment
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Provide valid concertId, customerId, rating (1–5), and comment.",
        },
        { status: 400 }
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
      { success: false, message: "Unable to add review." },
      { status: 500 }
    );
  }
}
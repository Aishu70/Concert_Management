import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });

    return NextResponse.json({
      success: true,
      message: "MongoDB connected successfully",
      database: db.databaseName,
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);

    return NextResponse.json(
      { success: false, message: "MongoDB connection failed" },
      { status: 500 }
    );
  }
}
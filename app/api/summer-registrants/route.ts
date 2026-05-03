import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { SummerRegistrantModel } from "@/app/lib/models/SummerRegistrant";

export async function GET() {
  try {
    await connectDB();

    const registrants = await SummerRegistrantModel.find({}).sort({
      createdAt: -1,
    });


    return NextResponse.json({
      success: true,
      registrants: registrants.map((registrant) => ({
        ...registrant.toObject(),
        _id: registrant._id?.toString?.() ?? registrant._id,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch summer registrants",
      },
      { status: 500 },
    );
  }
}

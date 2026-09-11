import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { pageId, isVariantB, isOwner } = body;

    if (!pageId) {
      return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
    }

    // Do not count views if viewer is logged in owner previewing draft
    if (isOwner) {
      return NextResponse.json({ success: true, skipped: "owner_preview" });
    }

    const incFields: Record<string, number> = { views: 1 };
    if (isVariantB) {
      incFields.variantBViews = 1;
    } else {
      incFields.variantAViews = 1;
    }

    // Atomic increment in MongoDB
    const updatedPage = await MagnetPageModel.findOneAndUpdate(
      { id: pageId },
      { $inc: incFields },
      { returnDocument: 'after' }
    ).lean();

    // Recalculate conversion rate atomically if page document exists
    if (updatedPage) {
      const views = updatedPage.views || 1;
      const signups = updatedPage.signups || 0;
      const conversionRate = parseFloat(((signups / views) * 100).toFixed(1));
      await MagnetPageModel.updateOne({ id: pageId }, { $set: { conversionRate } });
    }

    return NextResponse.json({ success: true, pageId });
  } catch (error: any) {
    console.error("View tracking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

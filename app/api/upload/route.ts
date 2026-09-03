import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { dbConnect } from "@/lib/mongodb";
import { ResourceModel } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory inside public if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate unique safe filename
    const id = Math.random().toString(36).substring(2, 9);
    const originalExt = path.extname(file.name);
    const safeFilename = `${id}${originalExt}`;
    const filePath = path.join(uploadsDir, safeFilename);

    // Save actual file to disk
    await fs.writeFile(filePath, buffer);

    const publicFileUrl = `${req.nextUrl.origin}/uploads/${safeFilename}`;
    const downloadRouteUrl = `${req.nextUrl.origin}/r/${id}`;

    const newResource = {
      id,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      url: downloadRouteUrl,
      fileUrl: publicFileUrl,
      fileExt: originalExt,
    };

    // Save metadata in DB
    await ResourceModel.create(newResource);

    return NextResponse.json({ success: true, data: newResource });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

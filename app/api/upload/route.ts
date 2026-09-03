import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { dbConnect } from "@/lib/mongodb";
import { ResourceModel } from "@/lib/models";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const id = Math.random().toString(36).substring(2, 9);
    const originalExt = path.extname(file.name);
    const safeFilename = `${id}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const userEmail = formData.get("userEmail") as string | null;

    let publicFileUrl = "";

    // 1. If Vercel Blob token is configured, upload directly to Vercel Blob Cloud
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(safeFilename, file, {
          access: "public",
        });
        publicFileUrl = blob.url;
      } catch (blobErr) {
        console.warn("Vercel Blob upload warning, using local/tmp fallback:", blobErr);
      }
    }

    // 2. Local disk / Vercel /tmp fallback
    if (!publicFileUrl) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const isVercel = Boolean(process.env.VERCEL);
      const uploadsDir = isVercel ? "/tmp" : path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});

      const filePath = path.join(uploadsDir, safeFilename);
      await fs.writeFile(filePath, buffer);

      publicFileUrl = `${req.nextUrl.origin}/uploads/${safeFilename}`;
    }

    const downloadRouteUrl = `${req.nextUrl.origin}/r/${id}`;

    const newResource = {
      id,
      userEmail: userEmail ? userEmail.trim().toLowerCase() : undefined,
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

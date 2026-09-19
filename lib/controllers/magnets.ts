import { NextResponse } from "next/server";
import { MagnetPageModel, SequenceModel } from "@/lib/models";
import { type MagnetPage, type Sequence } from "@/lib/data";
import { deleteCloudinaryAssets } from "@/lib/cloudinary";

export async function handleSavePages(data: any, normEmail: string | null) {
  if (Array.isArray(data) && data.length > 0) {
    const incomingIds = (data as MagnetPage[]).map((item) => item.id).filter(Boolean);
    const existingPages = await MagnetPageModel.find({ id: { $in: incomingIds } }).lean();
    const existingMap = new Map<string, MagnetPage>((existingPages as unknown as MagnetPage[]).map((p) => [p.id, p]));

    const replacedAssets: string[] = [];
    (data as MagnetPage[]).forEach((item) => {
      const oldPage = existingMap.get(item.id);
      if (oldPage) {
        if (oldPage.imageUrl && item.imageUrl && oldPage.imageUrl !== item.imageUrl) {
          replacedAssets.push(oldPage.imageUrl);
        }
        if (oldPage.variantBImage && item.variantBImage && oldPage.variantBImage !== item.variantBImage) {
          replacedAssets.push(oldPage.variantBImage);
        }
        if (Array.isArray(oldPage.pdfPages) && Array.isArray(item.pdfPages)) {
          const newSet = new Set(item.pdfPages);
          oldPage.pdfPages.forEach((oldPdfUrl: string) => {
            if (oldPdfUrl && !newSet.has(oldPdfUrl)) {
              replacedAssets.push(oldPdfUrl);
            }
          });
        }
      }
    });

    if (replacedAssets.length > 0) {
      deleteCloudinaryAssets(replacedAssets).catch((err) =>
        console.error("Cloudinary cleanup error on savePages:", err)
      );
    }

    const ops = (data as MagnetPage[]).map((item) => {
      const itemEmail = normEmail || item.userEmail || "";
      return {
        updateOne: {
          filter: { id: item.id, ...(normEmail ? { userEmail: normEmail } : {}) },
          update: { $set: { ...item, userEmail: itemEmail } },
          upsert: true,
        },
      };
    });
    await MagnetPageModel.bulkWrite(ops);
  }
  return NextResponse.json({ success: true });
}

export async function handleAddPage(data: any, normEmail: string | null) {
  const existingPage = (await MagnetPageModel.findOne({ id: data.id }).lean()) as unknown as MagnetPage | null;
  if (existingPage) {
    const replacedAssets: string[] = [];
    if (existingPage.imageUrl && data.imageUrl && existingPage.imageUrl !== data.imageUrl) {
      replacedAssets.push(existingPage.imageUrl);
    }
    if (existingPage.variantBImage && data.variantBImage && existingPage.variantBImage !== data.variantBImage) {
      replacedAssets.push(existingPage.variantBImage);
    }
    if (Array.isArray(existingPage.pdfPages) && Array.isArray(data.pdfPages)) {
      const newSet = new Set(data.pdfPages);
      existingPage.pdfPages.forEach((oldPdfUrl: string) => {
        if (oldPdfUrl && !newSet.has(oldPdfUrl)) {
          replacedAssets.push(oldPdfUrl);
        }
      });
    }
    if (replacedAssets.length > 0) {
      deleteCloudinaryAssets(replacedAssets).catch((err) =>
        console.error("Cloudinary cleanup error on addPage:", err)
      );
    }
  }

  const pageToInsert = normEmail ? { ...data, userEmail: normEmail } : data;
  await MagnetPageModel.findOneAndUpdate(
    { id: data.id, ...(normEmail ? { userEmail: normEmail } : {}) },
    pageToInsert,
    { upsert: true, returnDocument: 'after' }
  );
  return NextResponse.json({ success: true });
}

export async function handleDeletePage(data: any, normEmail: string | null) {
  const { id } = data;
  const filter = normEmail
    ? { id, userEmail: { $regex: new RegExp(`^${normEmail}$`, "i") } }
    : { id };

  const targetPage = (await MagnetPageModel.findOne(filter).lean()) as unknown as MagnetPage | null;
  if (targetPage) {
    const assetsToDelete: string[] = [];
    if (targetPage.imageUrl) assetsToDelete.push(targetPage.imageUrl);
    if (targetPage.variantBImage) assetsToDelete.push(targetPage.variantBImage);
    if (Array.isArray(targetPage.pdfPages)) {
      targetPage.pdfPages.forEach((url: string) => {
        if (url) assetsToDelete.push(url);
      });
    }
    if (assetsToDelete.length > 0) {
      deleteCloudinaryAssets(assetsToDelete).catch((err) =>
        console.error("Cloudinary cleanup error on deletePage:", err)
      );
    }
  }

  await MagnetPageModel.deleteOne(filter);
  return NextResponse.json({ success: true });
}

export async function handleIncrementViews(data: any) {
  const { pageId } = data;
  const page = await MagnetPageModel.findOne({ id: pageId });
  if (page) {
    page.views = (page.views || 0) + 1;
    if (page.views > 0) {
      page.conversionRate = parseFloat(((page.signups / page.views) * 100).toFixed(1));
    }
    await page.save();
  }
  return NextResponse.json({ success: true });
}

export async function handleSaveSequences(data: any, normEmail: string | null) {
  if (Array.isArray(data) && data.length > 0) {
    const ops = (data as Sequence[]).map((item) => {
      const itemEmail = normEmail || item.userEmail || "";
      return {
        updateOne: {
          filter: { id: item.id, ...(normEmail ? { userEmail: normEmail } : {}) },
          update: { $set: { ...item, userEmail: itemEmail } },
          upsert: true,
        },
      };
    });
    await SequenceModel.bulkWrite(ops);
  }
  return NextResponse.json({ success: true });
}

export async function handleDeleteSequence(data: any, normEmail: string | null) {
  const { id } = data;
  const filter = normEmail ? { id, userEmail: normEmail } : { id };
  const targetSeq = (await SequenceModel.findOne(filter).lean()) as unknown as Sequence | null;
  const pageIdToUpdate = targetSeq?.pageId || id;

  await SequenceModel.deleteOne(filter);
  await MagnetPageModel.updateMany(
    { $or: [{ id }, { id: pageIdToUpdate }] },
    { $set: { sequenceEnabled: false, sequenceEmails: [] } }
  );
  return NextResponse.json({ success: true });
}

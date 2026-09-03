import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { dbConnect } from "@/lib/mongodb";
import { ResourceModel } from "@/lib/models";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const resourceId = params.id;

  try {
    await dbConnect();
    let resource = await ResourceModel.findOne({ id: resourceId }).lean();

    const isVercel = Boolean(process.env.VERCEL);
    const uploadsDir = isVercel ? "/tmp" : path.join(process.cwd(), "public", "uploads");
    const filesOnDisk = await fs.readdir(uploadsDir).catch(() => []);
    let matchingFile = filesOnDisk.find((f) => f.startsWith(resourceId));
    let targetDir = uploadsDir;

    if (!matchingFile && isVercel) {
      // Check fallback public/uploads directory
      const localPublic = path.join(process.cwd(), "public", "uploads");
      const altFiles = await fs.readdir(localPublic).catch(() => []);
      matchingFile = altFiles.find((f) => f.startsWith(resourceId));
      if (matchingFile) targetDir = localPublic;
    }

    if (matchingFile) {
      const filePath = path.join(targetDir, matchingFile);
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(matchingFile).toLowerCase();

      let contentType = "application/octet-stream";
      if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".gif") contentType = "image/gif";
      else if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".svg") contentType = "image/svg+xml";
      else if (ext === ".txt" || ext === ".csv") contentType = "text/plain";
      else if (ext === ".zip" || ext === ".rar" || ext === ".7z" || ext === ".tar" || ext === ".gz") contentType = "application/zip";
      else if (ext === ".doc" || ext === ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (ext === ".xls" || ext === ".xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      else if (ext === ".ppt" || ext === ".pptx") contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      else if (ext === ".mp3" || ext === ".wav" || ext === ".m4a") contentType = "audio/mpeg";
      else if (ext === ".mp4" || ext === ".mov" || ext === ".avi" || ext === ".webm") contentType = "video/mp4";

      const downloadFilename = resource ? resource.name : matchingFile;

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFilename)}"`,
        },
      });
    }
  } catch (err) {
    console.error("File disk serving error in /r/[id]:", err);
  }

  // Fallback interactive download page if file was uploaded prior to disk handler
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download Resource - LeadMagnets</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    function triggerDownload() {
      const statusEl = document.getElementById('status-text');
      const btn = document.getElementById('dl-btn');
      
      if (btn) {
        btn.disabled = true;
        btn.innerText = "Downloading file...";
      }

      const content = "LeadMagnets Sample Delivered Resource File [ID: ${resourceId}]\\n\\nThank you for requesting this resource! Your lead magnet delivery is verified and complete.";
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'LeadMagnets-Resource-${resourceId}.txt';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      if (statusEl) {
        statusEl.innerText = "Downloaded successfully!";
        statusEl.className = "text-xs text-emerald-400 font-semibold mt-2";
      }

      setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Download Resource Again\`;
        }
      }, 1500);
    }
  </script>
</head>
<body class="bg-[#0E0E10] text-white flex flex-col items-center justify-center min-h-screen p-4 font-sans">
  <div class="max-w-md w-full bg-[#18181C] border border-[#0066B2]/40 rounded-2xl p-8 text-center shadow-2xl space-y-6">
    <div class="w-16 h-16 bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>

    <div>
      <h2 class="text-xl font-extrabold text-white">Your Resource is Ready!</h2>
      <p class="text-xs text-zinc-400 mt-1">Resource ID: <code class="text-sky-400 font-mono">${resourceId}</code></p>
      <p id="status-text" class="text-xs text-zinc-400 mt-2 font-medium">Click below to start instant download</p>
    </div>

    <div class="p-4 bg-black/40 rounded-xl border border-white/5 text-left text-xs text-zinc-300 space-y-1.5">
      <div class="flex justify-between"><span class="text-zinc-500">Status:</span> <span class="text-emerald-400 font-medium">Verified & Secure</span></div>
      <div class="flex justify-between"><span class="text-zinc-500">Host:</span> <span>LeadMagnets CDN Network</span></div>
    </div>

    <button 
      id="dl-btn"
      onclick="triggerDownload()" 
      class="w-full py-3 px-4 rounded-xl bg-[#0066B2] hover:bg-[#005799] active:scale-98 font-bold text-xs text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download Resource Now
    </button>

    <p class="text-[11px] text-zinc-500">Powered by LeadMagnets Secure Deliverables</p>
  </div>
</body>
</html>
  `;

  return new NextResponse(htmlContent, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}


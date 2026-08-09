import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Sniff the real content type from magic bytes — never trust the client's
 * declared MIME type. Returns the canonical type or null when unrecognized.
 */
function sniffMime(bytes: Uint8Array): "image/jpeg" | "image/png" | "application/pdf" | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  // PDF: %PDF
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }
  return null;
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Verify actual content (magic bytes), not the client-declared type.
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = sniffMime(bytes);
    if (!mime) {
      return NextResponse.json(
        { error: "Invalid file. Only JPEG, PNG, or PDF files are accepted." },
        { status: 400 }
      );
    }

    // Generate a server-controlled filename — the client's name never reaches
    // the storage path (no traversal / weird characters / spoofed extensions).
    const ext = EXT_BY_MIME[mime];
    const safeName = `proof-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const blob = await put(`proofs/${safeName}`, file, {
      access: "private",
      contentType: mime,
    });

    return NextResponse.json({
      url: blob.url,
      fileName: file.name.slice(0, 255),
      fileSize: file.size,
      mimeType: mime,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}

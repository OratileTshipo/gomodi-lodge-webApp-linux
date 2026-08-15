/**
 * Proof-of-payment upload — shared by the leisure / corporate / events flows.
 *
 * Client side: `uploadProofOfPayment()` posts to /api/upload, which sniffs
 * magic bytes, enforces the 5MB cap, and returns a private Vercel Blob URL
 * plus server-derived metadata.
 *
 * Server side: `sanitizePopMeta()` re-validates that metadata in the booking
 * actions — the client's claims are never trusted verbatim (mime allowlist,
 * size cap, name truncation) — and the URL itself is vetted by
 * `isSafeProofOfPaymentUrl()` in lib/validate.ts.
 */
export const POP_MIME_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

export type PopUploadResult =
  | { ok: true; url: string; fileName: string; fileSize: number; mimeType: string }
  | { ok: false; error: string };

export async function uploadProofOfPayment(file: File): Promise<PopUploadResult> {
  try {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const json = await res.json();
    if (!res.ok || typeof json.url !== "string") {
      return {
        ok: false,
        error: typeof json.error === "string" ? json.error : "Upload failed — try again.",
      };
    }
    return {
      ok: true,
      url: json.url,
      fileName: typeof json.fileName === "string" ? json.fileName : file.name,
      fileSize: typeof json.fileSize === "number" ? json.fileSize : file.size,
      mimeType: typeof json.mimeType === "string" ? json.mimeType : "",
    };
  } catch {
    return { ok: false, error: "Upload failed — check your connection and try again." };
  }
}

export type PopMeta = {
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
};

/**
 * Server-side: cap + allowlist the metadata a client claims about its upload.
 * Mismatches degrade to null rather than failing the booking — the URL check
 * (isSafeProofOfPaymentUrl) is the security gate; this is data hygiene.
 */
export function sanitizePopMeta(input: {
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
}): PopMeta {
  const fileName =
    typeof input.fileName === "string" && input.fileName.trim() !== ""
      ? input.fileName.trim().slice(0, 255)
      : null;
  const fileSize =
    typeof input.fileSize === "number" && Number.isFinite(input.fileSize) && input.fileSize > 0
      ? Math.floor(input.fileSize)
      : null;
  const mimeType =
    typeof input.mimeType === "string" && POP_MIME_TYPES.has(input.mimeType)
      ? input.mimeType
      : null;
  return { fileName, fileSize, mimeType };
}

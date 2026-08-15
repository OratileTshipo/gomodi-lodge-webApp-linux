"use client";

/**
 * Proof-of-payment uploader — the visible drop-zone + states. The parent owns
 * the upload call (uploadProofOfPayment) and the resulting URL/metadata, so
 * this stays presentational: it reports file selection via onSelect and lets
 * the user remove a chosen file via onClear.
 */
export function PopUpload({
  fileName,
  uploading,
  error,
  onSelect,
  onClear,
}: {
  fileName: string | null;
  uploading: boolean;
  error: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">
        Upload proof of payment (optional)
      </label>
      {fileName ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-walnut/10 bg-cream-light p-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-terracotta shrink-0">✓</span>
            <span className="text-sm text-ink font-medium truncate">{fileName}</span>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-stone hover:text-terracotta-dark shrink-0"
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          htmlFor="popFileInput"
          className="file-drop border-2 border-dashed border-walnut/20 rounded-xl p-5 text-center cursor-pointer bg-cream-light hover:bg-cream transition-colors block"
        >
          <input
            id="popFileInput"
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSelect(file);
              e.target.value = ""; // allow re-selecting the same file after an error
            }}
          />
          <span className="text-sm text-ink font-medium">
            {uploading ? "Uploading…" : "Tap to upload, or drag & drop"}
          </span>
          <span className="text-xs text-stone mt-1 block">PDF, JPG, or PNG · max 5MB</span>
        </label>
      )}
      {error && <span className="block text-xs text-terracotta-dark mt-1">{error}</span>}
    </div>
  );
}

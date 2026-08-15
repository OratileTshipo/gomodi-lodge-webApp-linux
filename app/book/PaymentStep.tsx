"use client";

import { PopUpload } from "@/components/PopUpload";

/**
 * Payment options — EFT (with banking details + proof-of-payment upload) or
 * cash on arrival. The upload itself happens through /api/upload; the parent
 * owns the upload state and passes it down so the submit handler can block
 * while a file is still uploading.
 */
export function PaymentStep({
  paymentMethod,
  setPaymentMethod,
  popFileName,
  popUploading,
  popUploadError,
  onUploadFile,
  onClearFile,
}: {
  paymentMethod: "eft" | "cash";
  setPaymentMethod: (m: "eft" | "cash") => void;
  popFileName: string | null;
  popUploading: boolean;
  popUploadError: string | null;
  onUploadFile: (file: File | undefined) => void;
  onClearFile: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 md:p-6 motion-fade-up motion-ready">
      <div className="mb-4">
        <span className="text-terracotta-dark font-semibold text-xs uppercase tracking-wide">Payment</span>
        <h2 className="font-semibold text-ink text-lg mt-1">Payment options</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className={`flex items-start gap-3 rounded-xl p-4 border cursor-pointer transition-all ${paymentMethod === "eft" ? "border-terracotta bg-terracotta-tint/50" : "border-walnut/10 bg-white hover:border-walnut/20"}`}>
          <input type="radio" checked={paymentMethod === "eft"} onChange={() => setPaymentMethod("eft")} className="mt-1 accent-terracotta" />
          <div><div className="font-semibold text-ink text-sm">EFT / Bank Transfer</div><div className="text-stone text-xs mt-0.5">Pay to our business account. Upload proof below.</div></div>
        </label>
        <label className={`flex items-start gap-3 rounded-xl p-4 border cursor-pointer transition-all ${paymentMethod === "cash" ? "border-terracotta bg-terracotta-tint/50" : "border-walnut/10 bg-white hover:border-walnut/20"}`}>
          <input type="radio" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} className="mt-1 accent-terracotta" />
          <div><div className="font-semibold text-ink text-sm">Cash on Arrival</div><div className="text-stone text-xs mt-0.5">Settle in person at check-in.</div></div>
        </label>
      </div>
      {paymentMethod === "eft" && (
        <>
          <div className="mt-4 bg-cream-light rounded-xl border border-walnut/10 p-4">
            <div className="font-semibold text-ink text-sm mb-2">Banking details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-walnut/10"><span className="text-stone">Bank</span><span className="text-ink font-medium">FNB</span></div>
              <div className="flex justify-between py-1 border-b border-walnut/10"><span className="text-stone">Account name</span><span className="text-ink font-medium">Gomodi Guest Lodge</span></div>
              <div className="flex justify-between py-1 border-b border-walnut/10"><span className="text-stone">Account number</span><span className="text-ink font-medium">62874592011</span></div>
              <div className="flex justify-between py-1 border-b border-walnut/10"><span className="text-stone">Branch code</span><span className="text-ink font-medium">250655</span></div>
            </div>
          </div>
          <div className="mt-4">
            <PopUpload
              fileName={popFileName}
              uploading={popUploading}
              error={popUploadError}
              onSelect={(file) => onUploadFile(file)}
              onClear={onClearFile}
            />
          </div>
        </>
      )}
    </div>
  );
}

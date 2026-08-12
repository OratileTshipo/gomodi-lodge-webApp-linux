import type { BookingRequest } from "./types";
import { fmtDate, getCategoryColor, getCategoryLabel } from "./format";

interface Props {
  req: BookingRequest;
  isManager: boolean;
  isPartner: boolean;
  onApprove: (id: number) => void;
  onDecline: (id: number) => void;
  onContact: (id: number) => void;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
      {children}
    </span>
  );
}

/** A single pending request card: conflict banners, details grid, actions. */
export function RequestCard({ req, isManager, isPartner, onApprove, onDecline, onContact }: Props) {
  const canAct =
    isManager ||
    (isPartner && req.category === "event") ||
    (!isManager && !isPartner && req.category === "leisure");

  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl border border-walnut/10 shadow-sm">
      {/* Conflict banners */}
      {req.pendingWarning && (
        <div className="bg-gold-tint border border-gold/40 text-gold-dark font-medium p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {req.pendingWarning}
        </div>
      )}

      {req.conflict && (
        <div className="bg-terracotta-tint border border-terracotta/40 text-terracotta-dark font-medium p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {req.conflict}
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={getCategoryColor(req.category)}>
          {getCategoryLabel(req.category)}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            req.proofOfPaymentUploaded
              ? "bg-walnut-tint text-walnut"
              : "bg-cream text-stone border border-walnut/10"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${req.proofOfPaymentUploaded ? "bg-walnut" : "bg-stone/30"}`}
          />
          POP {req.proofOfPaymentUploaded ? "Uploaded" : "Not Yet"}
        </span>
        {req.category === "event" && req.contactedAt && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-walnut-tint text-walnut">
            <span className="w-1.5 h-1.5 rounded-full bg-walnut" />
            Contacted
          </span>
        )}
        {req.category === "event" && isManager && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              req.notifiedPartnerAt
                ? "bg-walnut-tint text-walnut"
                : "bg-gold-tint text-gold-dark border border-gold/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                req.notifiedPartnerAt ? "bg-walnut" : "bg-gold-dark"
              }`}
            />
            Lelz {req.notifiedPartnerAt ? "Notified" : "Not Alerted"}
          </span>
        )}
        <h3 className="font-semibold text-ink text-base ml-auto">
          {req.guestName}
        </h3>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm border-t border-walnut/10 pt-4 mb-4">
        {/* Corporate fields */}
        {req.category === "corporate" && req.corporateDetails && (
          <>
            <div className="md:col-span-2">
              <FieldLabel>Company</FieldLabel>
              <span className="text-ink font-medium">
                {req.corporateDetails.companyName}
              </span>
              {req.corporateDetails.jobTitle && (
                <span className="block text-stone text-xs">
                  ({req.corporateDetails.jobTitle})
                </span>
              )}
            </div>
            {req.corporateDetails.poNumber && (
              <div>
                <FieldLabel>PO Number</FieldLabel>
                <span className="text-ink font-medium">
                  {req.corporateDetails.poNumber}
                </span>
              </div>
            )}
            {req.corporateDetails.vatNumber && (
              <div>
                <FieldLabel>VAT Number</FieldLabel>
                <span className="text-ink font-medium">
                  {req.corporateDetails.vatNumber}
                </span>
              </div>
            )}
            {req.corporateDetails.billingEmail && (
              <div>
                <FieldLabel>Billing Email</FieldLabel>
                <span className="text-ink font-medium">
                  {req.corporateDetails.billingEmail}
                </span>
              </div>
            )}
          </>
        )}

        {/* Event fields */}
        {req.category === "event" && req.eventDetails && (
          <>
            <div>
              <FieldLabel>Event Type</FieldLabel>
              <span className="text-ink font-medium capitalize">
                {req.eventDetails.eventType.replace("-", " ")}
              </span>
            </div>
            <div>
              <FieldLabel>Event Date</FieldLabel>
              <span className="text-ink font-medium">
                {fmtDate(req.eventDetails.eventDate)}
              </span>
            </div>
            <div>
              <FieldLabel>Expected Guests</FieldLabel>
              <span className="text-ink font-medium">
                {req.eventDetails.expectedGuests}
              </span>
            </div>
            {req.eventDetails.cateringPackage && (
              <div>
                <FieldLabel>Catering</FieldLabel>
                <span className="text-ink font-medium capitalize">
                  {req.eventDetails.cateringPackage.replace("-", " ")}
                </span>
              </div>
            )}
            {req.eventDetails.interestedInRooms && (
              <div className="md:col-span-2">
                <span className="inline-flex items-center gap-1.5 bg-walnut-tint text-walnut px-2.5 py-1 rounded text-xs font-medium">
                  Interested in room bookings
                </span>
              </div>
            )}
          </>
        )}

        {/* Leisure fields */}
        {req.category === "leisure" && (
          <>
            <div>
              <FieldLabel>Dates</FieldLabel>
              <span className="text-ink font-medium">
                {req.checkIn && req.checkOut
                  ? `${fmtDate(req.checkIn)} → ${fmtDate(req.checkOut)}`
                  : "—"}
              </span>
            </div>
            <div>
              <FieldLabel>Room</FieldLabel>
              <span className="text-ink font-medium">
                {req.roomName ?? "—"}
              </span>
            </div>
            <div>
              <FieldLabel>Guests</FieldLabel>
              <span className="text-ink font-medium">
                {req.guestCount ?? "—"}
              </span>
            </div>
          </>
        )}

        {/* Contact */}
        <div>
          <FieldLabel>Contact</FieldLabel>
          <span className="text-ink font-medium">
            {req.contactPhone}
          </span>
          {req.contactEmail && (
            <span className="block text-stone text-xs">
              {req.contactEmail}
            </span>
          )}
        </div>

        {/* Meals */}
        {req.addOns && req.addOns.length > 0 && (
          <div className="md:col-span-2">
            <FieldLabel>Meals</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {req.addOns.map((addon, idx) => (
                <span
                  key={idx}
                  className="bg-cream text-stone px-2 py-0.5 rounded text-xs border border-walnut/10"
                >
                  {addon.type} ({addon.persons}p)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Special Requests */}
        {req.specialRequests && (
          <div className="md:col-span-2">
            <FieldLabel>Special Requests</FieldLabel>
            <p className="text-ink italic bg-cream p-2.5 rounded-lg border-l-2 border-gold-dark text-sm">
              &ldquo;{req.specialRequests}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {canAct ? (
        <div className="flex gap-3 pt-3 border-t border-walnut/10">
          {/* Partner (Lelz) can also mark event requests "Contacted" */}
          {isPartner &&
            req.category === "event" &&
            (req.contactedAt ? (
              <div className="flex-1 flex items-center justify-center gap-1.5 bg-walnut-tint text-walnut px-4 py-2.5 rounded-lg text-sm font-semibold">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Contacted
              </div>
            ) : (
              <button
                onClick={() => onContact(req.id)}
                className="flex-1 bg-gold-tint text-gold-dark border border-gold/40 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gold/20 transition-colors btn-press"
              >
                Mark Contacted
              </button>
            ))}
          <button
            onClick={() => onApprove(req.id)}
            className="flex-1 bg-walnut text-cream-light px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-walnut-dark transition-colors btn-press shadow-sm shadow-walnut/20"
          >
            Approve
          </button>
          <button
            onClick={() => onDecline(req.id)}
            className="flex-1 border border-walnut/20 text-walnut px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-walnut/5 transition-colors btn-press"
          >
            Decline
          </button>
        </div>
      ) : (
        <div className="pt-3 border-t border-walnut/10">
          <div className="bg-cream text-stone px-4 py-2.5 rounded-lg text-sm text-center font-medium">
            Manager Approval Required
          </div>
        </div>
      )}
    </div>
  );
}

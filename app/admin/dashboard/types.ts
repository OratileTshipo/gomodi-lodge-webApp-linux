/** Shared types for the admin dashboard request queue. */

export interface AddOn {
  type: string;
  persons: number;
  date: string;
}

export interface CorporateDetails {
  jobTitle?: string | null;
  companyName: string;
  billingEmail?: string | null;
  poNumber?: string | null;
  vatNumber?: string | null;
  clientRef?: string | null;
  notes?: string | null;
}

export interface EventDetails {
  eventType: string;
  expectedGuests: number;
  eventDate: string;
  altDate?: string | null;
  cateringPackage?: string | null;
  interestedInRooms: boolean;
  notes?: string | null;
}

export interface BookingRequest {
  id: number;
  category: "leisure" | "corporate" | "event";
  guestName: string;
  contactPhone: string;
  contactEmail?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  roomName?: string | null;
  guestCount?: number | null;
  specialRequests?: string | null;
  status: "pending" | "approved" | "declined";
  conflict?: string | null;
  pendingWarning?: string | null;
  addOns?: AddOn[];
  corporateDetails?: CorporateDetails | null;
  eventDetails?: EventDetails | null;
  proofOfPaymentUploaded: boolean;
  notifiedPartnerAt?: string | null;
  contactedAt?: string | null;
}

export interface User {
  userId: number;
  name: string;
  role: "owner" | "assistant" | "staff" | "partner";
}

export type BookingAction = "approve" | "decline";

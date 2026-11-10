export type Category =
  | 'WatCard'
  | 'wallet'
  | 'electronics'
  | 'keys'
  | 'bottle'
  | 'clothing'
  | 'bag'
  | 'supplies'
  | 'other';

export type ItemStatus =
  | 'available'
  | 'in-transit'
  | 'reserved'
  | 'under-review'
  | 'ready-pickup'
  | 'picked-up'
  | 'moved-storage'
  | 'donated';

export type UserRole = 'student' | 'staff' | 'admin';

export interface DeskInfo {
  id: string;
  name: string;
  building: string;
  room: string;
  hours: string;
  description: string;
  phone: string;
  mapX?: number;
  mapY?: number;
}

export interface BuildingInfo {
  id: string;
  name: string;
  shortName: string;
  mapX: number;
  mapY: number;
  deskId: string | null;
}

export interface ClaimRecord {
  id: string;
  itemId: string;
  claimantId?: string;
  claimantName: string;
  claimantEmail: string;
  claimedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'contested';
  pickupCode: string;
  holdExpiresAt: string;
  verificationAnswer?: string;
  distinguishingDetail?: string;
  staffNotes?: string;
  isContested?: boolean;
  competingClaimId?: string;
}

export interface FoundItem {
  id: string;
  title: string;
  category: Category;
  subcategory?: string;
  colour: string;
  brand?: string;
  publicDescription: string;
  detailedDescription?: string;
  distinctiveFeatures?: string;
  desk: string;
  deskId?: string;
  photoFile?: File | null;
  dateLogged: string;
  daysAgo: number;
  status: ItemStatus;
  valuable: boolean;
  storageSpot?: string;
  imageUrl?: string;
  imagePath?: string;
  imageBucket?: 'public-photos' | 'private-photos' | null;
  watcardName?: string;
  locationFound?: string;
  dropOffCode?: string;
  finderId?: string;
  claim?: ClaimRecord;
  contestedClaims?: ClaimRecord[];
}

export interface NotificationItem {
  id: string;
  type: 'watcard_found' | 'match_alert' | 'claim_approved' | 'claim_rejected' | 'expiring_soon' | 'dropoff_thanks';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  relatedItemId?: string;
  actionText?: string;
  pickupCode?: string;
}

export interface NotifyAlert {
  id: string;
  category: Category;
  colour: string;
  brandOrKeyword: string;
  locationLost: string;
  dateLost: string;
  createdAt: string;
  active: boolean;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  studentId: string;
  claimsUsedThisWeek: number;
  maxWeeklyInstantClaims: number;
  isSignedIn: boolean;
  role?: UserRole;
  deskId?: string | null;
  deskName?: string | null;
}

export interface LostReport {
  id: string;
  ownerId: string;
  title: string;
  category: Category;
  subcategory?: string;
  colour: string;
  brand?: string;
  description: string;
  distinctiveFeatures?: string;
  privateDetails?: string;
  building: string;
  locationDetail?: string;
  lostAt: string;
  imageUrl?: string;
  status: 'active' | 'matched' | 'resolved' | 'closed';
  createdAt: string;
}

export interface ItemMatch {
  id: string;
  lostReportId: string;
  foundItemId: string;
  confidence: number;
  reasons: string[];
  differences: string[];
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
}

export interface ReturnTag {
  id: string;
  ownerId: string;
  code: string;
  label: string;
  category: Category;
  colour?: string;
  active: boolean;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  itemId?: string;
  reportId?: string;
  eventType: string;
  message: string;
  visibility: 'public' | 'staff';
  createdAt: string;
}

export interface PhotoScanResult {
  colour: string;
  category?: Category;
  subcategory?: string;
  brand?: string;
  distinctiveFeatures?: string;
  description?: string;
  source: 'colour' | 'gemini';
  file: File;
  previewUrl: string;
}

import type {
  BuildingInfo,
  Category,
  ClaimRecord,
  DeskInfo,
  FoundItem,
  ItemMatch,
  ItemStatus,
  LostReport,
  NotificationItem,
  ReturnTag,
  TimelineEvent,
  UserProfile,
  UserRole,
} from '../types';
import { requireClient } from './supabase';

interface DeskRow {
  id: string;
  name: string;
  building: string;
  room: string;
  hours: string;
  description: string;
  phone: string;
  map_x: number;
  map_y: number;
}

interface BuildingRow {
  id: string;
  name: string;
  short_name: string;
  map_x: number;
  map_y: number;
  desk_id: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  student_id: string | null;
  role: UserRole;
  desk_id: string | null;
  claims_used_this_week: number;
  desks?: { name: string } | null;
}

interface ItemRow {
  id: string;
  title?: string;
  category: string;
  subcategory: string | null;
  colour: string;
  brand?: string | null;
  public_description?: string;
  distinctive_features: string | null;
  desk_id: string;
  logged_at: string;
  status: ItemStatus;
  valuable: boolean;
  storage_spot: string | null;
  location_found: string | null;
  drop_off_code: string | null;
  image_path: string | null;
  image_bucket: 'public-photos' | 'private-photos' | null;
  finder_id: string | null;
  desks?: { name: string } | null;
}

interface SecretRow {
  item_id: string;
  detailed_description: string | null;
  watcard_name: string | null;
}

interface ClaimRow {
  id: string;
  item_id: string;
  claimant_id: string;
  status: ClaimRecord['status'];
  pickup_code: string | null;
  hold_expires_at: string | null;
  verification_answer: string | null;
  distinguishing_detail: string | null;
  staff_notes: string | null;
  is_contested: boolean;
  created_at: string;
  claimant?: { full_name: string; email: string } | null;
}

export function daysSince(iso: string): number {
  const elapsed = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(elapsed / 86_400_000));
}

export function mapDesk(row: DeskRow): DeskInfo {
  return {
    id: row.id,
    name: row.name,
    building: row.building,
    room: row.room,
    hours: row.hours,
    description: row.description,
    phone: row.phone,
    mapX: Number(row.map_x),
    mapY: Number(row.map_y),
  };
}

export function mapBuilding(row: BuildingRow): BuildingInfo {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    mapX: Number(row.map_x),
    mapY: Number(row.map_y),
    deskId: row.desk_id,
  };
}

export function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    studentId: row.student_id ?? '',
    claimsUsedThisWeek: row.claims_used_this_week,
    maxWeeklyInstantClaims: 3,
    isSignedIn: true,
    role: row.role,
    deskId: row.desk_id,
    deskName: row.desks?.name ?? null,
  };
}

export function publicPhotoUrl(bucket: string | null, path: string | null, valuable: boolean): string | undefined {
  if (!path || bucket !== 'public-photos' || valuable) return undefined;
  return requireClient().storage.from('public-photos').getPublicUrl(path).data.publicUrl;
}

export function mapItem(row: ItemRow, secret?: SecretRow): FoundItem {
  return {
    id: row.id,
    title: row.title ?? '',
    category: row.category as Category,
    subcategory: row.subcategory ?? undefined,
    colour: row.colour,
    brand: row.brand ?? undefined,
    publicDescription: row.public_description ?? '',
    detailedDescription: secret?.detailed_description ?? undefined,
    distinctiveFeatures: row.distinctive_features ?? undefined,
    desk: row.desks?.name ?? row.desk_id,
    deskId: row.desk_id,
    dateLogged: row.logged_at.slice(0, 10),
    daysAgo: daysSince(row.logged_at),
    status: row.status,
    valuable: row.valuable,
    storageSpot: row.storage_spot ?? undefined,
    imageUrl: publicPhotoUrl(row.image_bucket, row.image_path, row.valuable),
    imagePath: row.image_path ?? undefined,
    imageBucket: row.image_bucket,
    watcardName: secret?.watcard_name ?? undefined,
    locationFound: row.location_found ?? undefined,
    dropOffCode: row.drop_off_code ?? undefined,
    finderId: row.finder_id ?? undefined,
  };
}

export function mapClaim(row: ClaimRow): ClaimRecord {
  return {
    id: row.id,
    itemId: row.item_id,
    claimantId: row.claimant_id,
    claimantName: row.claimant?.full_name ?? 'Student',
    claimantEmail: row.claimant?.email ?? '',
    claimedAt: row.created_at,
    status: row.status,
    pickupCode: row.pickup_code ?? '',
    holdExpiresAt: row.hold_expires_at ?? '',
    verificationAnswer: row.verification_answer ?? undefined,
    distinguishingDetail: row.distinguishing_detail ?? undefined,
    staffNotes: row.staff_notes ?? undefined,
    isContested: row.is_contested,
  };
}

export function attachClaims(items: FoundItem[], claims: ClaimRecord[], userId: string, isStaff: boolean): FoundItem[] {
  return items.map((item) => {
    const related = claims.filter((claim) => claim.itemId === item.id && claim.status !== 'rejected');
    const mine = related.find((claim) => claim.claimantId === userId);
    const visible = isStaff ? related : mine ? [mine] : [];
    return {
      ...item,
      claim: visible[0],
      contestedClaims: visible.length > 1 ? visible : undefined,
    };
  });
}

export function mapNotification(row: {
  id: string;
  type: NotificationItem['type'];
  title: string;
  message: string;
  read: boolean;
  related_item_id: string | null;
  pickup_code: string | null;
  created_at: string;
}): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    timestamp: new Date(row.created_at).toLocaleString(),
    read: row.read,
    relatedItemId: row.related_item_id ?? undefined,
    pickupCode: row.pickup_code ?? undefined,
    actionText: row.pickup_code ? 'Show pickup code' : row.related_item_id ? 'View item' : undefined,
  };
}

export function mapReport(row: {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  subcategory: string | null;
  colour: string;
  brand: string | null;
  description: string;
  distinctive_features: string | null;
  private_details: string | null;
  building: string;
  location_detail: string | null;
  lost_at: string;
  image_path: string | null;
  status: LostReport['status'];
  created_at: string;
}): LostReport {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    category: row.category as Category,
    subcategory: row.subcategory ?? undefined,
    colour: row.colour,
    brand: row.brand ?? undefined,
    description: row.description,
    distinctiveFeatures: row.distinctive_features ?? undefined,
    privateDetails: row.private_details ?? undefined,
    building: row.building,
    locationDetail: row.location_detail ?? undefined,
    lostAt: row.lost_at,
    imageUrl: publicPhotoUrl('private-photos', null, true),
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapMatch(row: {
  id: string;
  lost_report_id: string;
  found_item_id: string;
  confidence: number;
  reasons: unknown;
  differences: unknown;
  status: ItemMatch['status'];
  created_at: string;
}): ItemMatch {
  const asStrings = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
  return {
    id: row.id,
    lostReportId: row.lost_report_id,
    foundItemId: row.found_item_id,
    confidence: row.confidence,
    reasons: asStrings(row.reasons),
    differences: asStrings(row.differences),
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapTag(row: {
  id: string;
  owner_id: string;
  code: string;
  label: string;
  category: string;
  colour: string | null;
  active: boolean;
  created_at: string;
}): ReturnTag {
  return {
    id: row.id,
    ownerId: row.owner_id,
    code: row.code,
    label: row.label,
    category: row.category as Category,
    colour: row.colour ?? undefined,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function mapTimeline(row: {
  id: string;
  item_id: string | null;
  report_id: string | null;
  event_type: string;
  message: string;
  visibility: 'public' | 'staff';
  created_at: string;
}): TimelineEvent {
  return {
    id: row.id,
    itemId: row.item_id ?? undefined,
    reportId: row.report_id ?? undefined,
    eventType: row.event_type,
    message: row.message,
    visibility: row.visibility,
    createdAt: row.created_at,
  };
}

import type { Category, ItemStatus } from '../types';
import {
  mapBuilding,
  mapClaim,
  mapDesk,
  mapItem,
  mapMatch,
  mapNotification,
  mapProfile,
  mapReport,
  mapTag,
  mapTimeline,
} from './mappers';
import { requireClient } from './supabase';

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function fetchDesks() {
  const client = requireClient();
  const { data, error } = await client.from('desks').select('*').order('name');
  fail(error);
  return (data ?? []).map(mapDesk);
}

export async function fetchBuildings() {
  const client = requireClient();
  const { data, error } = await client.from('buildings').select('*').order('name');
  fail(error);
  return (data ?? []).map(mapBuilding);
}

export async function fetchProfile(userId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('profiles')
    .select('*, desks(name)')
    .eq('id', userId)
    .maybeSingle();
  fail(error);
  return data ? mapProfile(data) : null;
}

export async function fetchItems(includePrivate: boolean) {
  const client = requireClient();
  const result = includePrivate
    ? await client.from('found_items').select('*, desks(name)').order('logged_at', { ascending: false })
    : await client.from('found_items').select('id, category, subcategory, colour, desk_id, logged_at, status, valuable, desks(name)').order('logged_at', { ascending: false });
  fail(result.error);
  const secretByItem = new Map<string, { item_id: string; detailed_description: string | null; watcard_name: string | null }>();
  if (includePrivate) {
    const secrets = await client.from('found_item_secrets').select('*');
    for (const row of secrets.error ? [] : secrets.data ?? []) secretByItem.set(row.item_id, row);
  }
  return (result.data ?? []).map((row) => mapItem(row, secretByItem.get(row.id)));
}

export async function fetchClaims() {
  const client = requireClient();
  const { data, error } = await client
    .from('claims')
    .select('*, claimant:profiles!claimant_id(full_name, email)')
    .order('created_at', { ascending: false });
  if (error && error.code !== 'PGRST301') fail(error);
  if (error) return [];
  return (data ?? []).map(mapClaim);
}

export async function fetchNotifications() {
  const client = requireClient();
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map(mapNotification);
}

export async function fetchReports() {
  const client = requireClient();
  const { data, error } = await client.from('lost_reports').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map(mapReport);
}

export async function fetchMatches() {
  const client = requireClient();
  const { data, error } = await client.from('item_matches').select('*').order('confidence', { ascending: false });
  if (error) return [];
  return (data ?? []).map(mapMatch);
}

export async function fetchTags() {
  const client = requireClient();
  const { data, error } = await client.from('return_tags').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map(mapTag);
}

export async function fetchTimeline() {
  const client = requireClient();
  const { data, error } = await client.from('timeline_events').select('*').order('created_at', { ascending: false });
  fail(error);
  return (data ?? []).map(mapTimeline);
}

export async function uploadPhoto(file: File, bucket: 'public-photos' | 'private-photos'): Promise<string> {
  const client = requireClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  fail(userError);
  if (!userData.user) throw new Error('Sign in before uploading a photo.');
  const path = `${userData.user.id}/${crypto.randomUUID()}.jpg`;
  const { error } = await client.storage.from(bucket).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  fail(error);
  return path;
}

export interface NewItemInput {
  title: string;
  category: Category;
  subcategory?: string;
  colour: string;
  brand?: string;
  publicDescription: string;
  distinctiveFeatures?: string;
  deskId: string;
  valuable: boolean;
  storageSpot?: string;
  locationFound?: string;
  imagePath?: string;
  imageBucket?: 'public-photos' | 'private-photos';
  detailedDescription?: string;
  watcardName?: string;
  status?: ItemStatus;
}

export async function createFoundItem(input: NewItemInput) {
  const client = requireClient();
  const { data, error } = await client
    .from('found_items')
    .insert({
      title: input.title,
      category: input.category,
      subcategory: input.subcategory || null,
      colour: input.colour,
      brand: input.brand || null,
      public_description: input.publicDescription,
      distinctive_features: input.distinctiveFeatures || null,
      desk_id: input.deskId,
      valuable: input.valuable,
      storage_spot: input.storageSpot || null,
      location_found: input.locationFound || null,
      image_path: input.imagePath || null,
      image_bucket: input.imageBucket || null,
      status: input.status ?? 'available',
    })
    .select('*, desks(name)')
    .single();
  fail(error);

  if (input.detailedDescription || input.watcardName) {
    const secret = await client.from('found_item_secrets').insert({
      item_id: data.id,
      detailed_description: input.detailedDescription || null,
      watcard_name: input.watcardName || null,
    });
    fail(secret.error);
  }
  return mapItem(data);
}

export async function createLostReport(input: {
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
  imagePath?: string;
}) {
  const client = requireClient();
  const { data, error } = await client
    .from('lost_reports')
    .insert({
      title: input.title,
      category: input.category,
      subcategory: input.subcategory || null,
      colour: input.colour,
      brand: input.brand || null,
      description: input.description,
      distinctive_features: input.distinctiveFeatures || null,
      private_details: input.privateDetails || null,
      building: input.building,
      location_detail: input.locationDetail || null,
      lost_at: input.lostAt,
      image_path: input.imagePath || null,
      owner_id: (await client.auth.getUser()).data.user?.id,
    })
    .select('*')
    .single();
  fail(error);
  return mapReport(data);
}

export async function createClaim(itemId: string, verificationAnswer?: string, distinguishingDetail?: string) {
  const client = requireClient();
  const userId = (await client.auth.getUser()).data.user?.id;
  const { data, error } = await client
    .from('claims')
    .insert({
      item_id: itemId,
      claimant_id: userId,
      status: 'pending',
      verification_answer: verificationAnswer || null,
      distinguishing_detail: distinguishingDetail || null,
    })
    .select('*, claimant:profiles!claimant_id(full_name, email)')
    .single();
  fail(error);
  return mapClaim(data);
}

export async function reviewClaim(claimId: string, status: 'approved' | 'rejected', staffNotes: string) {
  const client = requireClient();
  const { error } = await client.from('claims').update({ status, staff_notes: staffNotes }).eq('id', claimId);
  fail(error);
}

export async function updateItemStatus(itemId: string, status: ItemStatus, storageSpot?: string, overrideNote?: string) {
  const client = requireClient();
  const { error } = await client
    .from('found_items')
    .update({
      status,
      ...(storageSpot ? { storage_spot: storageSpot } : {}),
      override_note: overrideNote || null,
    })
    .eq('id', itemId);
  fail(error);
}

export async function createReturnTag(label: string, category: Category, colour: string) {
  const client = requireClient();
  const userId = (await client.auth.getUser()).data.user?.id;
  const { data, error } = await client
    .from('return_tags')
    .insert({ owner_id: userId, label, category, colour, code: '' })
    .select('*')
    .single();
  fail(error);
  return mapTag(data);
}

export async function scanReturnTag(code: string) {
  const client = requireClient();
  const userId = (await client.auth.getUser()).data.user?.id;
  const { error } = await client.from('tag_scans').insert({ code: code.trim().toUpperCase(), scanner_id: userId });
  fail(error);
}

export async function setMatchStatus(matchId: string, status: 'confirmed' | 'rejected') {
  const client = requireClient();
  const { error } = await client.from('item_matches').update({ status }).eq('id', matchId);
  fail(error);
}

export async function markNotificationsRead() {
  const client = requireClient();
  const userId = (await client.auth.getUser()).data.user?.id;
  const { error } = await client.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  fail(error);
}

export async function redeemStaffCode(code: string) {
  const client = requireClient();
  const userId = (await client.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('Sign in before using a staff code.');
  const { error } = await client.from('staff_redemptions').insert({ user_id: userId, code: code.trim() });
  fail(error);
}

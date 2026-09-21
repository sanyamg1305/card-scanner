import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VisitingCard, LeadPriority } from './types';

let cachedSupabase: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (!cachedSupabase) {
    cachedSupabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  return cachedSupabase;
}

import fs from 'node:fs';
import path from 'node:path';

// Fallback file storage (universal, requires zero native modules)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const fallbackFile = isServerless
  ? '/tmp/cards_store.json'
  : path.join(process.cwd(), 'data', 'cards_store.json');
const settingsFile = isServerless
  ? '/tmp/settings_store.json'
  : path.join(process.cwd(), 'data', 'settings_store.json');

function getRecordsFromFile(): any[] {
  try {
    if (fs.existsSync(fallbackFile)) {
      const data = fs.readFileSync(fallbackFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Fallback file read error:', e);
  }
  return [];
}

function saveRecordToFile(card: any) {
  try {
    const list = getRecordsFromFile();
    const idx = list.findIndex((c: any) => c.id === card.id);
    if (idx >= 0) {
      list[idx] = card;
    } else {
      list.unshift(card);
    }
    const dir = path.dirname(fallbackFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fallbackFile, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.warn('Fallback file write error:', e);
  }
}

function parseCardRow(row: any): VisitingCard {
  let productImages: string[] = [];
  if (Array.isArray(row.product_images)) {
    productImages = row.product_images;
  } else if (typeof row.product_images === 'string' && row.product_images.trim() !== '') {
    try {
      productImages = JSON.parse(row.product_images);
    } catch {
      productImages = [];
    }
  } else if (row.raw_extracted_json) {
    try {
      const parsed = JSON.parse(row.raw_extracted_json);
      if (Array.isArray(parsed._fallback_product_images)) {
        productImages = parsed._fallback_product_images;
      }
    } catch {}
  }

  let rawObj: any = {};
  if (row.raw_extracted_json) {
    try {
      rawObj = JSON.parse(row.raw_extracted_json);
    } catch {}
  }

  const description =
    row.description ||
    row.company_summary ||
    rawObj.description ||
    '';

  let categories: string[] = [];
  if (Array.isArray(row.categories)) {
    categories = row.categories;
  } else if (typeof row.categories === 'string' && row.categories.trim() !== '') {
    try {
      categories = JSON.parse(row.categories);
    } catch {
      categories = [];
    }
  } else if (Array.isArray(rawObj.categories)) {
    categories = rawObj.categories;
  } else if (row.category) {
    categories = [row.category];
  } else if (row.industry) {
    categories = [row.industry];
  }

  const category = row.category || categories[0] || row.industry || '';

  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    name: row.name || '',
    designation: row.designation || '',
    department: row.department || '',
    company: row.company || '',
    tagline: row.tagline || '',
    industry: row.industry || category || '',
    category,
    categories,
    description,
    role_type: row.role_type || '',
    company_summary: description || row.company_summary || '',
    phone: row.phone || '',
    phone_secondary: row.phone_secondary || '',
    email: row.email || '',
    email_secondary: row.email_secondary || '',
    website: row.website || '',
    address: row.address || '',
    city: row.city || '',
    country: row.country || '',
    linkedin: row.linkedin || '',
    other_social: row.other_social || '',
    exhibition_name: row.exhibition_name || '',
    booth_number: row.booth_number || '',
    meeting_notes: row.meeting_notes || '',
    action_items: row.action_items || '',
    follow_up_date: row.follow_up_date || '',
    lead_priority: (row.lead_priority as LeadPriority) || 'WARM',
    tags: Array.isArray(row.tags)
      ? row.tags
      : typeof row.tags === 'string'
      ? JSON.parse(row.tags || '[]')
      : [],
    image_front: row.image_front || '',
    image_back: row.image_back || '',
    product_images: productImages,
    raw_extracted_json: row.raw_extracted_json || '',
  };
}

export async function getAllCards(filters?: {
  search?: string;
  priority?: string;
  industry?: string;
  exhibition?: string;
}): Promise<VisitingCard[]> {
  const supabase = getSupabase();
  if (supabase) {
    let query = supabase.from('cards').select('*');

    if (filters?.priority && filters.priority !== 'ALL') {
      query = query.eq('lead_priority', filters.priority);
    }
    if (filters?.industry && filters.industry !== 'ALL') {
      query = query.eq('industry', filters.industry);
    }
    if (filters?.exhibition && filters.exhibition !== 'ALL') {
      query = query.eq('exhibition_name', filters.exhibition);
    }
    if (filters?.search) {
      const s = filters.search.trim();
      query = query.or(
        `name.ilike.%${s}%,company.ilike.%${s}%,designation.ilike.%${s}%,meeting_notes.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%,industry.ilike.%${s}%`
      );
    }

    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) {
      console.error('Supabase getAllCards error:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }
    return (data || []).map(parseCardRow);
  }

  // File storage fallback
  let list = getRecordsFromFile();

  if (filters?.priority && filters.priority !== 'ALL') {
    list = list.filter((c: any) => c.lead_priority === filters.priority);
  }
  if (filters?.industry && filters.industry !== 'ALL') {
    list = list.filter((c: any) => c.industry === filters.industry);
  }
  if (filters?.exhibition && filters.exhibition !== 'ALL') {
    list = list.filter((c: any) => c.exhibition_name === filters.exhibition);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (c: any) =>
        (c.name && c.name.toLowerCase().includes(s)) ||
        (c.company && c.company.toLowerCase().includes(s)) ||
        (c.designation && c.designation.toLowerCase().includes(s)) ||
        (c.phone && c.phone.toLowerCase().includes(s)) ||
        (c.meeting_notes && c.meeting_notes.toLowerCase().includes(s))
    );
  }

  return list.map(parseCardRow);
}

export async function getCardById(id: string): Promise<VisitingCard | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) return parseCardRow(data);
    } catch (e) {
      console.warn('Supabase getCardById error:', e);
    }
  }

  const list = getRecordsFromFile();
  const found = list.find((c: any) => c.id === id);
  return found ? parseCardRow(found) : null;
}

export async function createCard(data: Partial<VisitingCard>): Promise<VisitingCard> {
  const id = data.id || `card_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const description = data.description || data.company_summary || '';
  const categories =
    data.categories && data.categories.length > 0
      ? data.categories
      : data.category
      ? [data.category]
      : data.industry
      ? [data.industry]
      : [];
  const category = data.category || categories[0] || data.industry || '';

  const rawJson = (() => {
    try {
      const parsed = data.raw_extracted_json ? JSON.parse(data.raw_extracted_json) : {};
      parsed.description = description;
      parsed.categories = categories;
      parsed.category = category;
      return JSON.stringify(parsed);
    } catch {
      return JSON.stringify({ description, categories, category });
    }
  })();

  const record: Record<string, any> = {
    id,
    created_at: now,
    updated_at: now,
    name: data.name || 'Unnamed Contact',
    designation: data.designation || '',
    department: data.department || '',
    company: data.company || '',
    tagline: data.tagline || '',
    industry: category || data.industry || '',
    role_type: data.role_type || '',
    company_summary: description,
    phone: data.phone || '',
    phone_secondary: data.phone_secondary || '',
    email: data.email || '',
    email_secondary: data.email_secondary || '',
    website: data.website || '',
    address: data.address || '',
    city: data.city || '',
    country: data.country || '',
    linkedin: data.linkedin || '',
    other_social: data.other_social || '',
    exhibition_name: data.exhibition_name || '',
    booth_number: data.booth_number || '',
    meeting_notes: data.meeting_notes || '',
    action_items: data.action_items || '',
    follow_up_date: data.follow_up_date || '',
    lead_priority: data.lead_priority || 'WARM',
    tags: data.tags || [],
    image_front: data.image_front || '',
    image_back: data.image_back || '',
    product_images: data.product_images || [],
    raw_extracted_json: rawJson,
  };

  const supabase = getSupabase();
  if (supabase) {
    let { error } = await supabase.from('cards').insert(record);

    // If product_images or extra column is missing in Supabase schema, automatically retry without it
    if (
      error &&
      (error.message?.includes('product_images') ||
        error.message?.includes('column') ||
        error.code === 'PGRST204' ||
        error.code === '42703' ||
        error.message?.includes('schema cache'))
    ) {
      console.warn('Column missing in Supabase schema, retrying insert with standard columns fallback');
      const { product_images, description: _d, categories: _cats, category: _c, ...fallbackRecord } = record;
      // Stash product images in raw_extracted_json so user samples are safely preserved
      if (product_images && product_images.length > 0) {
        try {
          const rawObj = fallbackRecord.raw_extracted_json
            ? JSON.parse(fallbackRecord.raw_extracted_json)
            : {};
          rawObj._fallback_product_images = product_images;
          fallbackRecord.raw_extracted_json = JSON.stringify(rawObj);
        } catch {
          fallbackRecord.raw_extracted_json = JSON.stringify({
            description,
            categories,
            category,
            _fallback_product_images: product_images,
          });
        }
      }

      const retry = await supabase.from('cards').insert(fallbackRecord);
      error = retry.error;
    }

    if (error) {
      console.error('Supabase createCard error:', error);
      if (error.message?.includes('row-level security') || error.code === '42501') {
        throw new Error(
          'Supabase RLS is blocking inserts. In Supabase SQL Editor run: ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;'
        );
      }
      throw new Error(`Supabase insert failed: ${error.message} (Code: ${error.code || 'N/A'})`);
    }

    return parseCardRow(record);
  }

  // Universal file storage fallback
  saveRecordToFile(record);
  return parseCardRow(record);
}

export async function updateCard(
  id: string,
  data: Partial<VisitingCard>
): Promise<VisitingCard | null> {
  const existing = await getCardById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const description =
    data.description !== undefined
      ? data.description
      : data.company_summary !== undefined
      ? data.company_summary
      : existing.description || existing.company_summary || '';

  const categories =
    data.categories !== undefined
      ? data.categories
      : data.category
      ? [data.category]
      : existing.categories || [];
  const category =
    data.category !== undefined
      ? data.category
      : categories[0] || existing.category || existing.industry || '';

  const rawJson = (() => {
    try {
      const parsed = data.raw_extracted_json
        ? JSON.parse(data.raw_extracted_json)
        : existing.raw_extracted_json
        ? JSON.parse(existing.raw_extracted_json)
        : {};
      parsed.description = description;
      parsed.categories = categories;
      parsed.category = category;
      return JSON.stringify(parsed);
    } catch {
      return JSON.stringify({ description, categories, category });
    }
  })();

  const merged: Record<string, any> = {
    ...existing,
    ...data,
    description,
    categories,
    category,
    industry: category || data.industry || existing.industry || '',
    company_summary: description,
    raw_extracted_json: rawJson,
    updated_at: now,
  };

  const supabase = getSupabase();
  if (supabase) {
    let { error } = await supabase
      .from('cards')
      .update(merged)
      .eq('id', id);

    // If product_images or extra column is missing in Supabase schema, automatically retry without it
    if (
      error &&
      (error.message?.includes('product_images') ||
        error.message?.includes('column') ||
        error.code === 'PGRST204' ||
        error.code === '42703' ||
        error.message?.includes('schema cache'))
    ) {
      console.warn('Column missing in Supabase schema, retrying update with standard columns fallback');
      const { product_images, description: _d, categories: _cats, category: _c, ...fallbackMerged } = merged;
      if (product_images && product_images.length > 0) {
        try {
          const rawObj = fallbackMerged.raw_extracted_json
            ? JSON.parse(fallbackMerged.raw_extracted_json)
            : {};
          rawObj._fallback_product_images = product_images;
          fallbackMerged.raw_extracted_json = JSON.stringify(rawObj);
        } catch {
          fallbackMerged.raw_extracted_json = JSON.stringify({
            description,
            categories,
            category,
            _fallback_product_images: product_images,
          });
        }
      }

      const retry = await supabase
        .from('cards')
        .update(fallbackMerged)
        .eq('id', id);
      error = retry.error;
    }

    if (error) {
      console.error('Supabase updateCard error:', error);
      throw new Error(`Supabase update failed: ${error.message}`);
    }
    return parseCardRow(merged);
  }

  saveRecordToFile(merged);
  return parseCardRow(merged);
}

export async function deleteCard(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteCard error:', error);
      return false;
    }
    return true;
  }

  try {
    const list = getRecordsFromFile().filter((c: any) => c.id !== id);
    const dir = path.dirname(fallbackFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fallbackFile, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) {
        return defaultValue;
      }
      return data ? data.value : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  try {
    if (fs.existsSync(settingsFile)) {
      const parsed = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      return parsed[key] !== undefined ? parsed[key] : defaultValue;
    }
  } catch {
    return defaultValue;
  }
  return defaultValue;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('settings').upsert({ key, value });
    } catch (err) {
      console.error('Supabase setSetting error:', err);
    }
    return;
  }

  try {
    let map: Record<string, string> = {};
    if (fs.existsSync(settingsFile)) {
      try {
        map = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      } catch {}
    }
    map[key] = value;
    const dir = path.dirname(settingsFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(settingsFile, JSON.stringify(map, null, 2), 'utf8');
  } catch (err) {
    console.error('File setSetting error:', err);
  }
}

export async function getDashboardStats() {
  const cards = await getAllCards();

  const total = cards.length;
  const hot = cards.filter((c) => c.lead_priority === 'HOT').length;
  const warm = cards.filter((c) => c.lead_priority === 'WARM').length;
  const cold = cards.filter((c) => c.lead_priority === 'COLD').length;

  const industryMap = new Map<string, number>();
  const exhibitionMap = new Map<string, number>();

  for (const c of cards) {
    if (c.industry) {
      industryMap.set(c.industry, (industryMap.get(c.industry) || 0) + 1);
    }
    if (c.exhibition_name) {
      exhibitionMap.set(c.exhibition_name, (exhibitionMap.get(c.exhibition_name) || 0) + 1);
    }
  }

  const industries = Array.from(industryMap.entries())
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const exhibitions = Array.from(exhibitionMap.entries())
    .map(([exhibition_name, count]) => ({ exhibition_name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    hot,
    warm,
    cold,
    industries,
    exhibitions,
    isCloudConnected: Boolean(getSupabase()),
  };
}

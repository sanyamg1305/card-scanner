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

// Fallback SQLite instance for offline / local development
let sqliteDb: any = null;
function getSqliteDb() {
  if (!sqliteDb) {
    try {
      const { DatabaseSync } = require('node:sqlite');
      const path = require('node:path');
      const fs = require('node:fs');

      // Use /tmp if on Vercel/serverless or ./data locally
      const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const dataDir = isServerless ? '/tmp' : path.join(process.cwd(), 'data');

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const dbPath = path.join(dataDir, 'cards.db');
      sqliteDb = new DatabaseSync(dbPath);

      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS cards (
          id TEXT PRIMARY KEY,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          name TEXT NOT NULL,
          designation TEXT,
          department TEXT,
          company TEXT,
          tagline TEXT,
          industry TEXT,
          role_type TEXT,
          company_summary TEXT,
          phone TEXT,
          phone_secondary TEXT,
          email TEXT,
          email_secondary TEXT,
          website TEXT,
          address TEXT,
          city TEXT,
          country TEXT,
          linkedin TEXT,
          other_social TEXT,
          exhibition_name TEXT,
          booth_number TEXT,
          meeting_notes TEXT,
          action_items TEXT,
          follow_up_date TEXT,
          lead_priority TEXT DEFAULT 'WARM',
          tags TEXT DEFAULT '[]',
          image_front TEXT,
          image_back TEXT,
          product_images TEXT DEFAULT '[]',
          raw_extracted_json TEXT
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // Safe migration for existing SQLite DBs
      try {
        sqliteDb.exec("ALTER TABLE cards ADD COLUMN product_images TEXT DEFAULT '[]'");
      } catch (e) {}
    } catch (err) {
      console.warn('SQLite fallback unavailable:', err);
    }
  }
  return sqliteDb;
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

  // SQLite Fallback
  const db = getSqliteDb();
  if (!db) return [];

  let query = 'SELECT * FROM cards WHERE 1=1';
  const params: string[] = [];

  if (filters?.priority && filters.priority !== 'ALL') {
    query += ' AND lead_priority = ?';
    params.push(filters.priority);
  }
  if (filters?.industry && filters.industry !== 'ALL') {
    query += ' AND industry = ?';
    params.push(filters.industry);
  }
  if (filters?.exhibition && filters.exhibition !== 'ALL') {
    query += ' AND exhibition_name = ?';
    params.push(filters.exhibition);
  }
  if (filters?.search) {
    const s = `%${filters.search.toLowerCase()}%`;
    query += ` AND (
      LOWER(name) LIKE ? OR 
      LOWER(company) LIKE ? OR 
      LOWER(designation) LIKE ? OR 
      LOWER(meeting_notes) LIKE ? OR 
      LOWER(phone) LIKE ? OR 
      LOWER(email) LIKE ? OR 
      LOWER(industry) LIKE ? OR 
      LOWER(tags) LIKE ?
    )`;
    params.push(s, s, s, s, s, s, s, s);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  return rows.map(parseCardRow);
}

export async function getCardById(id: string): Promise<VisitingCard | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return parseCardRow(data);
  }

  const db = getSqliteDb();
  if (!db) return null;
  const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  if (!row) return null;
  return parseCardRow(row);
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
    let { data: inserted, error } = await supabase
      .from('cards')
      .insert(record)
      .select()
      .single();

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

      const retry = await supabase
        .from('cards')
        .insert(fallbackRecord)
        .select()
        .single();
      inserted = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Supabase createCard error:', error);
      throw new Error(`Supabase insert failed: ${error.message}`);
    }
    return parseCardRow(inserted);
  }

  const db = getSqliteDb();
  if (db) {
    const stmt = db.prepare(`
      INSERT INTO cards (
        id, created_at, updated_at, name, designation, department,
        company, tagline, industry, role_type, company_summary,
        phone, phone_secondary, email, email_secondary, website,
        address, city, country, linkedin, other_social,
        exhibition_name, booth_number, meeting_notes, action_items,
        follow_up_date, lead_priority, tags, image_front, image_back, product_images, raw_extracted_json
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      record.id,
      record.created_at,
      record.updated_at,
      record.name,
      record.designation,
      record.department,
      record.company,
      record.tagline,
      record.industry,
      record.role_type,
      record.company_summary,
      record.phone,
      record.phone_secondary,
      record.email,
      record.email_secondary,
      record.website,
      record.address,
      record.city,
      record.country,
      record.linkedin,
      record.other_social,
      record.exhibition_name,
      record.booth_number,
      record.meeting_notes,
      record.action_items,
      record.follow_up_date,
      record.lead_priority,
      JSON.stringify(record.tags),
      record.image_front,
      record.image_back,
      JSON.stringify(record.product_images || []),
      record.raw_extracted_json
    );
  }

  return (await getCardById(id))!;
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
    let { data: updated, error } = await supabase
      .from('cards')
      .update(merged)
      .eq('id', id)
      .select()
      .single();

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
        .eq('id', id)
        .select()
        .single();
      updated = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Supabase updateCard error:', error);
      throw new Error(`Supabase update failed: ${error.message}`);
    }
    return parseCardRow(updated);
  }

  const db = getSqliteDb();
  if (db) {
    const stmt = db.prepare(`
      UPDATE cards SET
        updated_at = ?,
        name = ?,
        designation = ?,
        department = ?,
        company = ?,
        tagline = ?,
        industry = ?,
        role_type = ?,
        company_summary = ?,
        phone = ?,
        phone_secondary = ?,
        email = ?,
        email_secondary = ?,
        website = ?,
        address = ?,
        city = ?,
        country = ?,
        linkedin = ?,
        other_social = ?,
        exhibition_name = ?,
        booth_number = ?,
        meeting_notes = ?,
        action_items = ?,
        follow_up_date = ?,
        lead_priority = ?,
        tags = ?,
        image_front = ?,
        image_back = ?,
        product_images = ?,
        raw_extracted_json = ?
      WHERE id = ?
    `);

    stmt.run(
      now,
      merged.name,
      merged.designation,
      merged.department,
      merged.company,
      merged.tagline,
      merged.industry,
      merged.role_type,
      merged.company_summary,
      merged.phone,
      merged.phone_secondary,
      merged.email,
      merged.email_secondary,
      merged.website,
      merged.address,
      merged.city,
      merged.country,
      merged.linkedin,
      merged.other_social,
      merged.exhibition_name,
      merged.booth_number,
      merged.meeting_notes,
      merged.action_items,
      merged.follow_up_date,
      merged.lead_priority,
      JSON.stringify(merged.tags || []),
      merged.image_front,
      merged.image_back,
      JSON.stringify(merged.product_images || []),
      merged.raw_extracted_json,
      id
    );
  }

  return await getCardById(id);
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

  const db = getSqliteDb();
  if (db) {
    db.prepare('DELETE FROM cards WHERE id = ?').run(id);
  }
  return true;
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
        console.warn('Supabase getSetting error:', error.message);
        return defaultValue;
      }
      return data ? data.value : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  const db = getSqliteDb();
  if (!db) return defaultValue;
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
    return row ? row.value : defaultValue;
  } catch {
    return defaultValue;
  }
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

  const db = getSqliteDb();
  if (db) {
    try {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    } catch (err) {
      console.error('SQLite setSetting error:', err);
    }
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

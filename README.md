# ExpoScan AI - Exhibition Visiting Card Scanner 📸📇

A mobile-first visiting card scanner and lead capture application engineered for trade shows, exhibitions, and conferences.

Built with **Next.js 14**, **Tailwind CSS**, **Google Gemini Multimodal AI**, and **Supabase (PostgreSQL)** for cloud persistence on **Vercel**.

---

## ⚡ 1-Minute Vercel & Supabase Setup

### Step 1: Run SQL in Supabase
1. Create a free project at [Supabase.com](https://supabase.com/).
2. Open the **SQL Editor** (`</>`) on the left navigation, click **New Query**, paste this SQL, and click **Run**:

```sql
-- 1. Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
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
  tags JSONB DEFAULT '[]'::jsonb,
  image_front TEXT,
  image_back TEXT,
  raw_extracted_json TEXT
);

-- 2. Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 3. Enable RLS and permissions
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to cards" ON public.cards
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to settings" ON public.settings
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Set default exhibition preset
INSERT INTO public.settings (key, value)
VALUES ('default_exhibition_name', 'Expo 2026')
ON CONFLICT (key) DO NOTHING;
```

---

### Step 2: Deploy to Vercel
1. Push this repository to your GitHub.
2. In [Vercel](https://vercel.com/), click **Add New Project** and select this repository.
3. In the **Environment Variables** section, add:

| Variable | Value | Where to find |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `AIzaSy...` | Free at [Google AI Studio](https://aistudio.google.com/) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase -> Project Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase -> Project Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase -> Project Settings -> API |

4. Click **Deploy**!

---

## ✨ Features

- **📸 Mobile Camera Capture**: Tap to snap cards right on your phone (`capture="environment"`) at your exhibition stall.
- **🤖 Gemini Flash Multimodal AI**:
  - Instant contact extraction (Name, Designation, Company, Phones, Emails, Website, Address, Socials).
  - Auto-categorizes **Industry** and **Role Persona** (Decision Maker, Buyer, Supplier, Partner).
  - Generates a concise 1-sentence **Company Summary**.
  - Auto-suggests relevant product tags.
- **📝 Live Meeting Notes**:
  - Record voice/text notes on what was discussed before the person leaves your booth.
  - Set Lead Rating: 🔥 **HOT**, ☀️ **WARM**, or ❄️ **COLD**.
  - Assign follow-up dates and action items.
- **⚡ Instant 1-Click Actions**:
  - 📇 **Save to Phone Contacts (`.vcf`)**: 1-tap download that directly opens Apple Contacts or Google Contacts with your meeting notes embedded.
  - 💬 **1-Click WhatsApp**: Instant greeting mentioning the exhibition.
  - ✉️ **AI Follow-up Email**: Generates tailored email drafts ready to copy or open in your mail app.
  - 📊 **Export to CSV / Excel**: Full CRM export for sales follow-ups.

---

## 💻 Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your browser.

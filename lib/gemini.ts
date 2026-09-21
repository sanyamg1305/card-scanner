import { GoogleGenerativeAI } from '@google/generative-ai';
import { CardScanResult, VisitingCard } from './types';
import { getSetting } from './db';

const PREFERRED_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-2.5-pro',
  'gemini-1.5-pro',
];

export async function getGeminiApiKey(explicitKey?: string): Promise<string> {
  if (explicitKey && explicitKey.trim().length > 0) {
    return explicitKey.trim();
  }
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return process.env.GEMINI_API_KEY.trim();
  }
  const dbKey = await getSetting('gemini_api_key');
  if (dbKey && dbKey.trim().length > 0) {
    return dbKey.trim();
  }
  return '';
}

/**
 * Dynamically queries the Google Gemini API to find the active model supported by this key
 */
async function discoverAvailableModel(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (res.ok) {
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        const supported = data.models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace(/^models\//, ''));

        // Prioritize preferred models that exist in the account's supported list
        const matched = PREFERRED_MODELS.filter((m) => supported.includes(m));
        // Add any other active flash models
        const otherFlash = supported.filter((m: string) => m.includes('flash') && !matched.includes(m));
        // Combine
        const candidates = [...matched, ...otherFlash, ...supported];
        if (candidates.length > 0) {
          return candidates;
        }
      }
    }
  } catch (err) {
    console.warn('Could not query available Gemini models, defaulting to standard candidates', err);
  }
  return PREFERRED_MODELS;
}

export async function parseCardWithGemini(
  images: {
    frontBase64: string;
    frontMime: string;
    backBase64?: string;
    backMime?: string;
    productImagesBase64?: string[];
  },
  apiKeyOverride?: string
): Promise<CardScanResult> {
  const apiKey = await getGeminiApiKey(apiKeyOverride);

  if (!apiKey) {
    throw new Error(
      'Gemini API Key is missing. Please set GEMINI_API_KEY in your Vercel/environment settings or enter it in the app Settings tab.'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = await discoverAvailableModel(apiKey);

  const prompt = `
You are an expert AI business card analyzer specialized for trade shows and exhibitions.
Analyze the provided business card image(s) (Front and optional Back) and any attached product/sample photos.
Extract all contact and business information with high precision and classify the business.

Return ONLY a JSON object matching this exact schema:
{
  "name": "Full name of the person (include prefix like Dr./Mr. if present, or leave clean)",
  "designation": "Job title or role (e.g. Managing Director, Sales Head, Founder)",
  "department": "Department if specified (e.g. International Sales, R&D, Procurement)",
  "company": "Official company or brand name",
  "tagline": "Company tagline or slogan if printed on card",
  "phone": "Primary phone number or mobile number (include country/area code if visible)",
  "phone_secondary": "Secondary phone or WhatsApp number if available",
  "email": "Primary work email address",
  "email_secondary": "Alternate email if available",
  "website": "Company website URL",
  "address": "Full street address / office location",
  "city": "City name",
  "country": "Country name",
  "linkedin": "LinkedIn profile or handle if on card",
  "other_social": "Other social handles (Twitter/X, Instagram, WeChat, etc.)",
  "industry": "Industry or business domain (e.g. Manufacturing, Software & IT, Packaging, Logistics, Healthcare, Chemicals, Construction, Retail, Finance, Textile, etc.)",
  "role_type": "One of: 'Decision Maker', 'Buyer', 'Supplier', 'Partner', 'Distributor', 'Consultant', 'Other'",
  "company_summary": "A concise 1-sentence summary of what this company does or makes, based on their products/services/tagline and sample photos",
  "suggested_tags": ["array", "of", "3-5", "relevant", "keywords", "or", "products"],
  "suggested_priority": "HOT" if high-level decision maker / director / CXO, else "WARM"
}

If any field is not visible on the card, leave it as an empty string "". Ensure phone numbers, emails, and URLs are cleaned up.
`;

  const contents: any[] = [prompt];

  function cleanBase64Data(raw: string, defaultMime = 'image/jpeg'): { data: string; mimeType: string } {
    let mimeType = defaultMime;
    let data = raw.trim();
    const match = data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,([\s\S]+)$/);
    if (match) {
      mimeType = match[1];
      data = match[2];
    } else {
      data = data.replace(/^data:[^;]+;base64,/, '');
    }
    // Remove all whitespace/linebreaks
    data = data.replace(/\s+/g, '');
    return { data, mimeType };
  }

  // Front image
  const front = cleanBase64Data(images.frontBase64, images.frontMime);
  contents.push({
    inlineData: {
      data: front.data,
      mimeType: front.mimeType,
    },
  });

  // Optional back image
  if (images.backBase64) {
    const back = cleanBase64Data(images.backBase64, images.backMime);
    contents.push({
      inlineData: {
        data: back.data,
        mimeType: back.mimeType,
      },
    });
  }

  // Optional product photos
  if (images.productImagesBase64 && images.productImagesBase64.length > 0) {
    for (const pImg of images.productImagesBase64.slice(0, 3)) {
      const p = cleanBase64Data(pImg);
      contents.push({
        inlineData: {
          data: p.data,
          mimeType: p.mimeType,
        },
      });
    }
  }

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const result = await model.generateContent(contents);
      const text = result.response.text();
      return JSON.parse(text) as CardScanResult;
    } catch (err: any) {
      lastError = err;
      const msg = err.message || '';
      // If 404 or unsupported model, continue to next candidate
      if (msg.includes('404') || msg.includes('not found') || msg.includes('supported') || msg.includes('deprecated')) {
        console.warn(`Model ${modelName} not available, attempting next candidate...`);
        continue;
      }
      // If it's an authentication error or invalid key, throw immediately
      if (msg.includes('API_KEY_INVALID') || msg.includes('quota') || msg.includes('unauthorized')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to analyze business card with available Gemini models.');
}

export async function generateFollowupEmailDraft(
  card: VisitingCard,
  instructions?: string,
  apiKeyOverride?: string
): Promise<{ subject: string; body: string }> {
  const apiKey = await getGeminiApiKey(apiKeyOverride);
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please set GEMINI_API_KEY in environment or Settings.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = await discoverAvailableModel(apiKey);

  const prompt = `
You are an executive assistant drafting a personalized, highly professional follow-up email after meeting a contact at a trade exhibition.

Contact Details:
- Name: ${card.name}
- Title: ${card.designation || 'N/A'}
- Company: ${card.company || 'N/A'}
- Industry: ${card.industry || 'N/A'}
- Met At Exhibition: ${card.exhibition_name || 'the exhibition'} (Booth: ${card.booth_number || 'N/A'})
- Conversation & Notes from the meeting: ${card.meeting_notes || 'None recorded'}
- Agreed Action Items: ${card.action_items || 'None recorded'}
- Specific user instructions: ${instructions || 'Write a warm, concise, high-converting follow-up'}

Format requirements:
Return ONLY a JSON object:
{
  "subject": "Compelling, clear email subject line referencing the exhibition and company",
  "body": "The complete email body text with placeholders like [My Name] / [My Company] where applicable"
}
`;

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (err: any) {
      lastError = err;
      const msg = err.message || '';
      if (msg.includes('404') || msg.includes('not found') || msg.includes('supported') || msg.includes('deprecated')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Failed to generate follow-up email with available Gemini models.');
}

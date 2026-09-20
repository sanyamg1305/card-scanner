import { GoogleGenerativeAI } from '@google/generative-ai';
import { CardScanResult, VisitingCard } from './types';
import { getSetting } from './db';

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

export async function parseCardWithGemini(
  images: { frontBase64: string; frontMime: string; backBase64?: string; backMime?: string },
  apiKeyOverride?: string
): Promise<CardScanResult> {
  const apiKey = await getGeminiApiKey(apiKeyOverride);

  if (!apiKey) {
    throw new Error(
      'Gemini API Key is missing. Please set GEMINI_API_KEY in your Vercel/environment settings or enter it in the app Settings tab.'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use gemini-2.0-flash with native JSON mode
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const prompt = `
You are an expert AI business card analyzer specialized for trade shows and exhibitions.
Analyze the provided business card image(s) (Front and optional Back).
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
  "company_summary": "A concise 1-sentence summary of what this company does or makes, based on their products/services/tagline",
  "suggested_tags": ["array", "of", "3-5", "relevant", "keywords", "or", "products"],
  "suggested_priority": "HOT" if high-level decision maker / director / CXO, else "WARM"
}

If any field is not visible on the card, leave it as an empty string "". Ensure phone numbers, emails, and URLs are cleaned up.
`;

  const contents: any[] = [prompt];

  // Front image
  contents.push({
    inlineData: {
      data: images.frontBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
      mimeType: images.frontMime || 'image/jpeg',
    },
  });

  // Optional back image
  if (images.backBase64) {
    contents.push({
      inlineData: {
        data: images.backBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
        mimeType: images.backMime || 'image/jpeg',
      },
    });
  }

  try {
    const result = await model.generateContent(contents);
    const text = result.response.text();
    const parsed = JSON.parse(text) as CardScanResult;
    return parsed;
  } catch (err: any) {
    // If gemini-2.0-flash is unavailable or throttled, try gemini-1.5-flash
    if (err.message && (err.message.includes('404') || err.message.includes('not found') || err.message.includes('model'))) {
      const fallbackModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      const fallbackResult = await fallbackModel.generateContent(contents);
      const fallbackText = fallbackResult.response.text();
      return JSON.parse(fallbackText) as CardScanResult;
    }
    throw err;
  }
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
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

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

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}

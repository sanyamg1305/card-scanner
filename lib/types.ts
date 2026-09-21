export type LeadPriority = 'HOT' | 'WARM' | 'COLD';

export interface VisitingCard {
  id: string;
  created_at: string;
  updated_at: string;
  
  // Person
  name: string;
  designation?: string;
  department?: string;
  
  // Company
  company: string;
  tagline?: string;
  industry?: string;
  role_type?: string; // Decision Maker, Buyer, Supplier, Partner, Distributor, Consultant
  company_summary?: string;
  
  // Contact
  phone?: string;
  phone_secondary?: string;
  email?: string;
  email_secondary?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  
  // Socials
  linkedin?: string;
  other_social?: string;
  
  // Exhibition Context & Notes
  exhibition_name?: string;
  booth_number?: string;
  meeting_notes?: string;
  action_items?: string;
  follow_up_date?: string;
  lead_priority: LeadPriority;
  tags: string[]; // parsed from JSON array
  
  // Images & Raw Data
  image_front?: string;
  image_back?: string;
  product_images?: string[]; // Array of product/sample photo data URLs
  raw_extracted_json?: string;
}

export interface CardScanResult {
  name: string;
  designation: string;
  department: string;
  company: string;
  tagline: string;
  phone: string;
  phone_secondary: string;
  email: string;
  email_secondary: string;
  website: string;
  address: string;
  city: string;
  country: string;
  linkedin: string;
  other_social: string;
  industry: string;
  role_type: string;
  company_summary: string;
  suggested_tags: string[];
  suggested_priority: LeadPriority;
}

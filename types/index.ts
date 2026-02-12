export * from './database';

export interface Citation {
  document: string;
  article: number;
  clause?: number;
  point?: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isBlurred?: boolean;
  detailedContent?: string;
  citations?: Citation[];
  detectedChemicals?: string[];
}

export interface LeadFormData {
  email: string;
  phone_zalo: string;
  company_name?: string;
  intent_tag: 'tu_van_luat' | 'mua_hoa_chat' | 'xu_ly_moi_truong' | 'khac';
}

export const INTENT_OPTIONS = [
  { value: 'tu_van_luat', label: 'Tu van phap luat hoa chat' },
  { value: 'mua_hoa_chat', label: 'Mua hoa chat cong nghiep' },
  { value: 'xu_ly_moi_truong', label: 'Xu ly moi truong' },
  { value: 'khac', label: 'Nhu cau khac' },
] as const;

export const GHS_PICTOGRAMS: Record<string, { name: string; description: string }> = {
  GHS01: { name: 'Explosive', description: 'Chat no' },
  GHS02: { name: 'Flammable', description: 'De chay' },
  GHS03: { name: 'Oxidizer', description: 'Chat oxy hoa' },
  GHS04: { name: 'Compressed Gas', description: 'Khi nen' },
  GHS05: { name: 'Corrosive', description: 'An mon' },
  GHS06: { name: 'Toxic', description: 'Doc cap tinh' },
  GHS07: { name: 'Irritant', description: 'Kich ung' },
  GHS08: { name: 'Health Hazard', description: 'Nguy hai suc khoe' },
  GHS09: { name: 'Environmental', description: 'Nguy hai moi truong' },
};

/**
 * Static demo directories used when real integrations are unavailable.
 * Every entry here is FICTIONAL / DEMO. No real facility, provider, pharmacy, or partnership is implied.
 */

export interface Facility {
  id: string;
  name: string;
  type: "hospital" | "clinic" | "health_complex" | "diagnostic";
  area: string;
  district: string;
  phone: string;
  services: string[];
  open24h: boolean;
  distanceKm: number;
}

export const DEMO_FACILITIES: Facility[] = [
  { id: "f1", name: "Demo District Hospital", type: "hospital", area: "Sadar", district: "Demo District", phone: "+880 2 0000 0001", services: ["24h emergency", "Obstetric care", "Caesarean section", "Blood bank"], open24h: true, distanceKm: 3.2 },
  { id: "f2", name: "Demo Upazila Health Complex", type: "health_complex", area: "Upazila Centre", district: "Demo District", phone: "+880 2 0000 0002", services: ["Antenatal care", "Normal delivery", "Vaccination", "Referral"], open24h: true, distanceKm: 1.4 },
  { id: "f3", name: "Demo Mother & Child Clinic", type: "clinic", area: "Bazar Road", district: "Demo District", phone: "+880 2 0000 0003", services: ["Antenatal care", "Ultrasound", "Family planning"], open24h: false, distanceKm: 2.1 },
  { id: "f4", name: "Demo Diagnostic Centre", type: "diagnostic", area: "Station Road", district: "Demo District", phone: "+880 2 0000 0004", services: ["Blood tests", "Ultrasound", "OGTT"], open24h: false, distanceKm: 2.6 },
  { id: "f5", name: "Demo Medical College Hospital", type: "hospital", area: "College Road", district: "Neighbouring District", phone: "+880 2 0000 0005", services: ["24h emergency", "High-risk pregnancy unit", "NICU", "Blood bank"], open24h: true, distanceKm: 18.5 },
  { id: "f6", name: "Demo Community Clinic", type: "clinic", area: "Village Ward 4", district: "Demo District", phone: "+880 2 0000 0006", services: ["Basic antenatal check", "Referral", "Iron/folic acid"], open24h: false, distanceKm: 0.8 },
];

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  experienceNote: string;
  languages: string[];
  slots: string[]; // HH:mm
  fee: string;
}

export const DEMO_PROVIDERS: Provider[] = [
  { id: "p1", name: "Dr. Demo Provider A", specialty: "Obstetrics & Gynaecology (demo)", experienceNote: "Fictional profile for demonstration", languages: ["Bangla", "English"], slots: ["10:00", "11:30", "17:00", "18:30"], fee: "Demo — no charge" },
  { id: "p2", name: "Dr. Demo Provider B", specialty: "Maternal-Fetal Medicine (demo)", experienceNote: "Fictional profile for demonstration", languages: ["Bangla", "English"], slots: ["09:00", "12:00", "16:00"], fee: "Demo — no charge" },
  { id: "p3", name: "Demo Midwife C", specialty: "Midwifery & antenatal counselling (demo)", experienceNote: "Fictional profile for demonstration", languages: ["Bangla"], slots: ["08:30", "13:00", "15:30", "19:00"], fee: "Demo — no charge" },
];

export interface Product {
  id: string;
  name: string;
  category: "prenatal" | "supplement" | "baby";
  description: string;
  price: number;
  requiresPrescription: boolean;
}

export const DEMO_PRODUCTS: Product[] = [
  { id: "m1", name: "Iron + Folic Acid tablets (30)", category: "prenatal", description: "Demo listing. Take only as advised by your healthcare provider.", price: 120, requiresPrescription: false },
  { id: "m2", name: "Calcium 500 mg tablets (30)", category: "prenatal", description: "Demo listing. Take only as advised by your healthcare provider.", price: 150, requiresPrescription: false },
  { id: "m3", name: "Prenatal multivitamin (30)", category: "supplement", description: "Demo listing. Discuss suitability with your provider.", price: 350, requiresPrescription: false },
  { id: "m4", name: "Vitamin D3 drops", category: "supplement", description: "Demo listing.", price: 220, requiresPrescription: false },
  { id: "m5", name: "Oral rehydration salts (10 sachets)", category: "supplement", description: "Demo listing.", price: 60, requiresPrescription: false },
  { id: "m6", name: "Digital blood pressure monitor", category: "prenatal", description: "Demo listing. Home monitoring device.", price: 2400, requiresPrescription: false },
  { id: "m7", name: "Newborn cotton wraps (3)", category: "baby", description: "Demo listing.", price: 450, requiresPrescription: false },
  { id: "m8", name: "Baby nappies, newborn size (30)", category: "baby", description: "Demo listing.", price: 520, requiresPrescription: false },
  { id: "m9", name: "Digital thermometer", category: "baby", description: "Demo listing.", price: 300, requiresPrescription: false },
  { id: "m10", name: "Prescription-only medicine (example)", category: "prenatal", description: "Demo listing showing how prescription-required items are gated.", price: 0, requiresPrescription: true },
];

export interface DangerSign {
  id: string;
  label: string;
  urgent: boolean;
  info: string;
}

export const DANGER_SIGNS: DangerSign[] = [
  { id: "bleeding", label: "Vaginal bleeding (more than light spotting)", urgent: true, info: "Bleeding in pregnancy should always be assessed by a professional promptly." },
  { id: "headache", label: "Severe headache that does not go away", urgent: true, info: "Especially with vision changes or swelling, this needs prompt professional assessment." },
  { id: "vision", label: "Blurred vision, flashing lights or spots", urgent: true, info: "Visual changes should be assessed urgently." },
  { id: "abdominal", label: "Severe abdominal pain", urgent: true, info: "Persistent or severe pain needs urgent assessment." },
  { id: "movement", label: "Baby moving much less than usual or not at all", urgent: true, info: "Do not wait until tomorrow — contact your provider or facility now." },
  { id: "fever", label: "High fever or chills", urgent: true, info: "Fever in pregnancy should be assessed promptly." },
  { id: "fluid", label: "Gush or steady leak of fluid before 37 weeks", urgent: true, info: "May indicate waters breaking early; seek care now." },
  { id: "convulsion", label: "Fits, convulsions or loss of consciousness", urgent: true, info: "Call 999 immediately." },
  { id: "breath", label: "Difficulty breathing or chest pain", urgent: true, info: "Call 999 immediately." },
  { id: "swelling", label: "Sudden swelling of face, hands or feet", urgent: true, info: "Sudden swelling, particularly with headache, needs prompt assessment." },
  { id: "urine", label: "Burning or pain when passing urine", urgent: false, info: "Worth discussing with your provider soon." },
  { id: "vomiting", label: "Vomiting and unable to keep fluids down", urgent: false, info: "If it continues for more than a day, seek advice." },
  { id: "contractions", label: "Regular painful tightenings before 37 weeks", urgent: true, info: "Could be early labour; contact your facility now." },
];

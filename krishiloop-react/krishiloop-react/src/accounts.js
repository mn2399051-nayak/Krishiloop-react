/* ---------- DEMO ACCOUNTS & ROLES DATA ----------
   Rich preset accounts representing all key actors in KrishiLoop's
   circular agriculture workflow in Punjab.
------------------------------------------------- */

export const DEMO_ACCOUNTS = [
  {
    id: "acc-farmer",
    name: "Gurpreet Singh",
    firstName: "Gurpreet",
    lastName: "Singh",
    email: "gurpreet.s@demo.krishiloop.in",
    role: "Farmer",
    badge: "Verified Farmer",
    avatarBg: "#d8b34d",
    avatarColor: "#1a2717",
    avatarUrl: "/images/gurpreet.jpg",
    coverUrl: "/images/hero_harvest.jpg",
    initials: "GS",
    phone: "+91 98760 12345",
    district: "Sangrur",
    village: "Dhuri",
    org: "Dhuri Progressive Farmers Collective",
    bio: "Paddy and wheat farmer cultivating 18 acres in Dhuri block. Committed to zero stubble burning through prompt mechanized baling and digital marketplace listing.",
    memberSince: "Oct 2024",
    employeeId: "KL-FAR-108",
    isVerified: true,
    kycStatus: "Verified",
    idProofType: "Aadhaar Card",
    idProofNumber: "XXXX-XXXX-2345",
    idProofVerifiedAt: "12 Oct 2024",
    authMethod: "phone_otp",
    stats: [
      { label: "Residue listed", value: "38.5 t" },
      { label: "Active supply lots", value: "3 lots" },
      { label: "Match confirmation rate", value: "94%" },
    ],
    recentActivity: [
      { type: "green", icon: "✓", text: "Identity verified via UIDAI Aadhaar e-KYC", time: "12 Oct 2024" },
      { type: "green", icon: "✓", text: "Listed <b>L-101</b> (12.5 t paddy straw) at Dhuri field", time: "Today, 10:15 AM" },
      { type: "straw", icon: "📈", text: "Match proposed with <b>Sangrur Biomass Pellets</b> — score 92%", time: "Yesterday, 3:40 PM" },
      { type: "blue", icon: "🔔", text: "Collection vehicle scheduled for pickup on 28 Oct", time: "2 days ago, 9:20 AM" },
      { type: "green", icon: "✓", text: "Payment released for <b>L-096</b> (₹22,500 via direct DBT transfer)", time: "5 days ago, 4:10 PM" },
    ],
  },
  {
    id: "acc-collector",
    name: "Harpreet Singh",
    firstName: "Harpreet",
    lastName: "Singh",
    email: "harpreet.collector@demo.krishiloop.in",
    role: "Collector",
    badge: "Fleet Aggregator",
    avatarBg: "#2d6e4a",
    avatarColor: "#ffffff",
    coverUrl: "/images/drone_fields.jpg",
    initials: "HS",
    phone: "+91 98141 87654",
    district: "Sangrur",
    village: "Sangrur",
    org: "Malwa Bio-Logistics Fleet Ltd.",
    bio: "Operating 6 balers and 12 GPS-tracked tractors across Sangrur and Malerkotla clusters. Specialised in rapid farmgate baling, route consolidation, and processing depot delivery.",
    memberSince: "Aug 2024",
    employeeId: "KL-COL-042",
    isVerified: true,
    kycStatus: "Verified",
    idProofType: "Aadhaar Card",
    idProofNumber: "XXXX-XXXX-7654",
    idProofVerifiedAt: "18 Aug 2024",
    authMethod: "phone_otp",
    stats: [
      { label: "Total collected", value: "142 t" },
      { label: "Active routes", value: "4 routes" },
      { label: "On-time delivery", value: "98%" },
    ],
    recentActivity: [
      { type: "green", icon: "✓", text: "Fleet aggregator license & Aadhaar verified", time: "18 Aug 2024" },
      { type: "green", icon: "✓", text: "Completed pickup job <b>J-201</b> (18.4 t) to Sangrur Biomass Depot", time: "Today, 11:30 AM" },
      { type: "straw", icon: "📈", text: "Optimised collection route for <b>Lehragaga cluster</b> (3 farm stops)", time: "Yesterday, 5:10 PM" },
      { type: "blue", icon: "🔔", text: "Baler unit #3 deployed to Bhawanigarh fields", time: "3 days ago, 7:45 AM" },
      { type: "green", icon: "✓", text: "Digital weighbridge slip verified at Sangrur depot", time: "4 days ago, 6:00 PM" },
    ],
  },
  {
    id: "acc-processor",
    name: "Sunil Jain",
    firstName: "Sunil",
    lastName: "Jain",
    email: "sunil.jain@sangrurbiomass.com",
    role: "Processor",
    badge: "Industrial Processor",
    avatarBg: "#1b5fa1",
    avatarColor: "#ffffff",
    coverUrl: "/images/biomass_plant.jpg",
    initials: "SJ",
    phone: "+91 98722 54321",
    district: "Malerkotla",
    village: "Malerkotla",
    org: "Sangrur Biomass Pellets Pvt. Ltd.",
    bio: "General Manager at Sangrur Biomass facility with 120 t/day intake capacity. Producing high-calorific biofuel pellets for state thermal power stations and industrial boilers.",
    memberSince: "Jul 2024",
    employeeId: "KL-PRC-019",
    isVerified: true,
    kycStatus: "Verified",
    idProofType: "Aadhaar Card",
    idProofNumber: "XXXX-XXXX-4321",
    idProofVerifiedAt: "05 Jul 2024",
    authMethod: "phone_otp",
    stats: [
      { label: "Plant intake", value: "245 t" },
      { label: "Open requirements", value: "80 t" },
      { label: "Pellets dispatched", value: "190 t" },
    ],
    recentActivity: [
      { type: "green", icon: "✓", text: "Corporate GSTIN & Aadhaar e-KYC verified", time: "05 Jul 2024" },
      { type: "green", icon: "✓", text: "Recorded processor intake for <b>L-104</b> (14.2 t from Jasmeet Kaur)", time: "Today, 1:20 PM" },
      { type: "straw", icon: "📈", text: "Updated biomass intake specification: max moisture 14%", time: "Yesterday, 2:00 PM" },
      { type: "blue", icon: "🔔", text: "Dispatched 40 t pellets to Punjab State Power Corporation", time: "4 days ago, 11:00 AM" },
      { type: "green", icon: "✓", text: "Confirmed boiler fuel grade quality certification", time: "1 week ago, 10:30 AM" },
    ],
  },
  {
    id: "acc-buyer",
    name: "Rajesh Sharma",
    firstName: "Rajesh",
    lastName: "Sharma",
    email: "procurement@patialapaper.in",
    role: "Buyer",
    badge: "Commercial Offtaker",
    avatarBg: "#8f6e28",
    avatarColor: "#ffffff",
    coverUrl: "/images/straw_bales.jpg",
    initials: "RS",
    phone: "+91 99880 11223",
    district: "Patiala",
    village: "Patiala",
    org: "Patiala Paper Board Mill",
    bio: "Head of Sustainable Procurement at Patiala Paper Mills. Sourcing unburned paddy and wheat straw for eco-friendly packaging and corrugation boards.",
    memberSince: "Nov 2024",
    employeeId: "KL-BYR-005",
    isVerified: true,
    kycStatus: "Verified",
    idProofType: "Aadhaar Card",
    idProofNumber: "XXXX-XXXX-1223",
    idProofVerifiedAt: "10 Nov 2024",
    authMethod: "phone_otp",
    stats: [
      { label: "Straw purchased", value: "310 t" },
      { label: "Active contracts", value: "5 units" },
      { label: "Fossil coal saved", value: "185 t" },
    ],
    recentActivity: [
      { type: "green", icon: "✓", text: "Commercial offtaker KYC & PAN verified", time: "10 Nov 2024" },
      { type: "green", icon: "✓", text: "Published demand requirement <b>D-203</b> (30 t Wheat straw)", time: "Yesterday, 10:00 AM" },
      { type: "straw", icon: "📈", text: "Confirmed payment release for Lot <b>L-098</b> (₹54,000)", time: "3 days ago, 4:15 PM" },
      { type: "blue", icon: "🔔", text: "Feedstock contract renewed for 2026 rabi harvest season", time: "5 days ago, 2:30 PM" },
      { type: "green", icon: "✓", text: "Corporate ESG audit verified zero-burn supply chain origin", time: "1 week ago, 3:00 PM" },
    ],
  },
  {
    id: "acc-admin",
    name: "Amanpreet Kaur",
    firstName: "Amanpreet",
    lastName: "Kaur",
    email: "amanpreet.k@punjab-agri.gov.in",
    role: "Admin",
    badge: "System Administrator",
    avatarBg: "#20593d",
    avatarColor: "#ffffff",
    coverUrl: "/images/hero_harvest.jpg",
    initials: "AK",
    phone: "+91 98150 99887",
    district: "Chandigarh",
    village: "Chandigarh",
    org: "Punjab Agri Circular Economy Initiative",
    bio: "State nodal officer overseeing pilot monitoring, multi-district logistics, stubble fire prevention compliance, and carbon audit reporting across Punjab.",
    memberSince: "Jun 2024",
    employeeId: "KL-ADM-001",
    isVerified: true,
    kycStatus: "Verified",
    idProofType: "Aadhaar Card",
    idProofNumber: "XXXX-XXXX-9887",
    idProofVerifiedAt: "01 Jun 2024",
    authMethod: "phone_otp",
    stats: [
      { label: "District coverage", value: "4 districts" },
      { label: "Registered farmers", value: "148" },
      { label: "Residue diverted", value: "520 t" },
    ],
    recentActivity: [
      { type: "green", icon: "✓", text: "State Government Official Credentials & e-KYC Active", time: "01 Jun 2024" },
      { type: "green", icon: "✓", text: "Generated weekly pilot traceability audit report", time: "Today, 8:45 AM" },
      { type: "straw", icon: "📈", text: "Approved collector subsidy verification for <b>Sangrur fleet</b>", time: "Yesterday, 1:15 PM" },
      { type: "blue", icon: "🔔", text: "Added Malerkotla bio-CNG depot to state supply map", time: "2 days ago, 12:00 PM" },
      { type: "green", icon: "✓", text: "Synchronised satellite fire detection sensor feed with SAC", time: "3 days ago, 9:00 AM" },
    ],
  },
];

export const CUSTOM_ACCOUNTS_KEY = "krishiloop-custom-accounts";

export function getCustomAccounts() {
  try {
    const raw = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomAccount(acc) {
  try {
    // Security: Only predefined system administrator (acc-admin) can have role "Admin"
    const safeAccount = (acc.role === "Admin" && acc.id !== "acc-admin" && acc.email !== "amanpreet.k@punjab-agri.gov.in")
      ? { ...acc, role: "Farmer" }
      : acc;
    const list = getCustomAccounts();
    const idx = list.findIndex(a => a.id === safeAccount.id || (safeAccount.phone && cleanPhone(a.phone) === cleanPhone(safeAccount.phone)));
    let updated;
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = { ...updated[idx], ...safeAccount };
    } else {
      updated = [safeAccount, ...list];
    }
    localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(updated));
    return safeAccount;
  } catch {
    return acc;
  }
}

export function getAllAccounts() {
  const custom = getCustomAccounts();
  // Filter out any duplicates if custom account overrides demo
  const customPhones = new Set(custom.map(c => cleanPhone(c.phone)));
  const base = DEMO_ACCOUNTS.filter(d => !customPhones.has(cleanPhone(d.phone)));
  return [...custom, ...base];
}

export function cleanPhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "").slice(-10);
}

export function findAccountByPhone(phone) {
  const target = cleanPhone(phone);
  if (!target || target.length < 10) return null;
  const all = getAllAccounts();
  return all.find(a => cleanPhone(a.phone) === target) || null;
}

export function findAccountByRoleOrEmail(roleOrEmail) {
  if (!roleOrEmail) return DEMO_ACCOUNTS[0];
  const all = getAllAccounts();
  const found = all.find(
    a => (a.email && a.email.toLowerCase() === roleOrEmail.toLowerCase()) ||
      (a.role && a.role.toLowerCase() === roleOrEmail.toLowerCase()) ||
      (a.id && a.id.toLowerCase() === roleOrEmail.toLowerCase())
  );
  return found || DEMO_ACCOUNTS[0];
}

export function createNewVerifiedAccount({
  phone,
  name,
  role = "Farmer",
  district = "Sangrur",
  village = "Dhuri",
  idProofType = "Aadhaar Card",
  idProofNumber = "",
  documentName = "aadhaar_card_doc.pdf",
}) {
  // Security: Do not allow self-granting Admin privilege
  const allowedRoles = ["Farmer", "Collector", "Processor", "Buyer", "Transporter"];
  const sanitizedRole = (role === "Admin" || !allowedRoles.includes(role)) ? "Farmer" : role;
  const actualRole = sanitizedRole === "Transporter" ? "Collector" : sanitizedRole;

  const clean = cleanPhone(phone);
  const formattedPhone = clean.length === 10 ? `+91 ${clean.slice(0, 5)} ${clean.slice(5)}` : phone;
  const parts = (name || "New User").trim().split(" ");
  const firstName = parts[0] || "Farmer";
  const lastName = parts.slice(1).join(" ") || "";
  const initials = `${firstName[0] || "U"}${lastName[0] || firstName[1] || ""}`.toUpperCase();

  const roleColors = {
    Farmer: { bg: "#d8b34d", color: "#1a2717" },
    Collector: { bg: "#2d6e4a", color: "#ffffff" },
    Processor: { bg: "#1b5fa1", color: "#ffffff" },
    Buyer: { bg: "#8f6e28", color: "#ffffff" },
    Admin: { bg: "#20593d", color: "#ffffff" },
  };

  const colors = roleColors[actualRole] || { bg: "#059669", color: "#ffffff" };
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const maskedId = idProofNumber
    ? (idProofNumber.length >= 4 ? `XXXX-XXXX-${idProofNumber.replace(/\D/g, "").slice(-4)}` : idProofNumber)
    : `XXXX-XXXX-${randomSuffix}`;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeFormatted = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const newAccount = {
    id: `acc-user-${Date.now().toString(36)}`,
    name: name.trim() || `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${clean.slice(-4)}@user.krishiloop.in`,
    role: sanitizedRole,
    badge: `Verified ${sanitizedRole}`,
    avatarBg: colors.bg,
    avatarColor: colors.color,
    initials,
    phone: formattedPhone,
    district,
    village,
    org: sanitizedRole === "Farmer" ? `${village} Farmers Group` : `${district} Agricultural Loop`,
    bio: `${sanitizedRole} onboarded via verified Phone OTP and Aadhaar e-KYC in ${district} district. Zero-burn certified.`,
    memberSince: `${now.toLocaleString("en-IN", { month: "short" })} ${now.getFullYear()}`,
    employeeId: `KL-${sanitizedRole.slice(0, 3).toUpperCase()}-${randomSuffix}`,
    isVerified: true,
    kycStatus: "Verified",
    idProofType,
    idProofNumber: maskedId,
    idProofVerifiedAt: dateFormatted,
    documentName,
    authMethod: "phone_otp",
    stats: [
      { label: "Verification status", value: "Verified ✓" },
      { label: "Zero-burn compliance", value: "100%" },
      { label: "Active lots", value: "0 lots" },
    ],
    recentActivity: [
      {
        type: "green",
        icon: "🛡",
        text: `Identity verified via <b>${idProofType} e-KYC</b> (${maskedId}) with OTP confirmation`,
        time: `Today, ${timeFormatted}`,
      },
      {
        type: "blue",
        icon: "📱",
        text: `Phone number <b>${formattedPhone}</b> authenticated via SMS OTP`,
        time: `Today, ${timeFormatted}`,
      },
      {
        type: "green",
        icon: "✓",
        text: `Regular website access granted for <b>${sanitizedRole}</b> workspace`,
        time: `Today, ${timeFormatted}`,
      },
    ],
  };

  saveCustomAccount(newAccount);
  return newAccount;
}

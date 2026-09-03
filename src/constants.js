export const MATTER_STATUSES = ["Intake", "Active", "Pending Hearing", "Settlement", "Closed"];

export const MATTER_COLORS = {
  Intake: "#B08D57",
  Active: "#6B2737",
  "Pending Hearing": "#8A6D3B",
  Settlement: "#3D5A4C",
  Closed: "#8A8578",
};

export const BILL_STATUSES = ["Draft", "Sent", "Paid", "Overdue"];

export const BILL_COLORS = {
  Draft: "#8A8578",
  Sent: "#B08D57",
  Paid: "#3D5A4C",
  Overdue: "#6B2737",
};

export const INQUIRY_STATUSES = ["New", "Contacted", "Consultation Scheduled", "Converted", "Declined", "Lost"];

export const INQUIRY_COLORS = {
  New: "#B08D57",
  Contacted: "#8A6D3B",
  "Consultation Scheduled": "#3D6B8A",
  Converted: "#3D5A4C",
  Declined: "#8A8578",
  Lost: "#6B2737",
};

export const INQUIRY_SOURCES = ["Referral", "Website", "Walk-in", "Phone", "WhatsApp", "Social Media", "Other"];

export const PRACTICE_AREAS = [
  "Civil Litigation",
  "Criminal Defense",
  "Family Law",
  "Corporate Law",
  "Intellectual Property",
  "Real Estate",
  "Taxation",
  "Labor & Employment",
  "Arbitration",
  "Constitutional Law",
];

export const PRACTICE_COLORS = [
  "#6B2737",
  "#B08D57",
  "#3D5A4C",
  "#8A6D3B",
  "#2C3E50",
  "#7A5230",
  "#4A6B5B",
  "#8C4B5E",
  "#5C6B73",
  "#9E7B3B",
];

export const COURTS = [
  "Supreme Court / Cassation",
  "High Court / Court of Appeal",
  "District Court / Court of First Instance",
  "Commercial Court",
  "Labour Tribunal",
  "Arbitration Tribunal (DIAC / ICC)",
  "Family Court",
  "Tax Appellate Tribunal",
];

export const STATUTORY_DEADLINE_TYPES = [
  "Statutory Limitation for Appeal",
  "Written Statement / Counter Affidavit",
  "Rejoinder / Replication",
  "Evidence by Affidavit (Trial)",
  "Interrogatories & Discovery",
  "Court Deposit / Cost Compliance",
  "Written Submissions / Arguments",
  "Caveat Renewal (90 Days)"
];

export const SEED_DATA = {
  clients: [
    {
      id: "a1111111-1111-4111-8111-111111111111",
      name: "Al-Mansoor International Trading LLC",
      company: "Al-Mansoor Holdings",
      email: "legal@almansoor.ae",
      phone: "+971 4 398 2200",
      notes: "Annual Retainer Client - Commercial & Cross-border arbitration.",
    },
    {
      id: "a2222222-2222-4222-8222-222222222222",
      name: "Dr. Sarah Jenkins",
      company: "Apex BioHealth Corp",
      email: "s.jenkins@apexbio.com",
      phone: "+1 415 890 2234",
      notes: "Patent dispute & IP licensing counsel.",
    },
    {
      id: "a3333333-3333-4333-8333-333333333333",
      name: "Tariq Al-Hashimi",
      company: "Private Individual",
      email: "tariq.hashimi@outlook.com",
      phone: "+971 50 442 1199",
      notes: "Real estate title rectification and partition suit.",
    },
  ],
  matters: [
    {
      id: "b1111111-1111-4111-8111-111111111111",
      title: "Al-Mansoor vs. Global Freight Logistics",
      clientId: "a1111111-1111-4111-8111-111111111111",
      practiceArea: "Arbitration",
      advocate: "Adv. Tariq Rahman, Senior Counsel",
      status: "Active",
      filingDate: "2024-01-15",
      notes: "DIAC Arbitration Claim for breach of maritime delivery contract.",
    },
    {
      id: "b2222222-2222-4222-8222-222222222222",
      title: "Apex BioHealth vs. GenCore Pharma Inc.",
      clientId: "a2222222-2222-4222-8222-222222222222",
      practiceArea: "Intellectual Property",
      advocate: "Adv. Sarah Miller",
      status: "Pending Hearing",
      filingDate: "2024-02-01",
      notes: "Patent infringement injunction application.",
    },
    {
      id: "b3333333-3333-4333-8333-333333333333",
      title: "Al-Hashimi Estate Partition Suit",
      clientId: "a3333333-3333-4333-8333-333333333333",
      practiceArea: "Real Estate",
      advocate: "Adv. Fatima Noor",
      status: "Intake",
      filingDate: "2024-03-10",
      notes: "Inheritance properties distribution before Civil First Instance Court.",
    },
  ],
  hearings: [
    {
      id: "c1111111-1111-4111-8111-111111111111",
      matterId: "b1111111-1111-4111-8111-111111111111",
      date: "2026-08-30",
      court: "Arbitration Tribunal (DIAC / ICC)",
      notes: "Cross-examination of Claimant's Quantum Expert witness.",
    },
    {
      id: "c2222222-2222-4222-8222-222222222222",
      matterId: "b2222222-2222-4222-8222-222222222222",
      date: "2026-09-02",
      court: "High Court / Court of Appeal",
      notes: "Oral arguments on temporary injunction application.",
    },
    {
      id: "c3333333-3333-4333-8333-333333333333",
      matterId: "b3333333-3333-4333-8333-333333333333",
      date: "2026-09-14",
      court: "District Court / Court of First Instance",
      notes: "First hearing for filing Written Statement & Preliminary Objections.",
    },
  ],
  billing: [
    {
      id: "d1111111-1111-4111-8111-111111111111",
      matterId: "b1111111-1111-4111-8111-111111111111",
      description: "Arbitration Filing & Statement of Claim drafting",
      amount: "35000",
      currency: "AED",
      date: "2024-02-15",
      status: "Paid",
    },
    {
      id: "d2222222-2222-4222-8222-222222222222",
      matterId: "b2222222-2222-4222-8222-222222222222",
      description: "Senior Counsel opinion & injunction brief preparation",
      amount: "18500",
      currency: "AED",
      date: "2024-03-01",
      status: "Sent",
    },
    {
      id: "d3333333-3333-4333-8333-333333333333",
      matterId: "b3333333-3333-4333-8333-333333333333",
      description: "Retainer deposit & Title verification search report",
      amount: "8000",
      currency: "AED",
      date: "2024-03-11",
      status: "Draft",
    },
  ],
};

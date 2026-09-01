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

export const SEED_DATA = {
  clients: [
    {
      id: "cl_1",
      name: "Al-Mansoor International Trading LLC",
      company: "Al-Mansoor Holdings",
      email: "legal@almansoor.ae",
      phone: "+971 4 398 2200",
      notes: "Annual Retainer Client - Commercial & Cross-border arbitration.",
    },
    {
      id: "cl_2",
      name: "Dr. Sarah Jenkins",
      company: "Apex BioHealth Corp",
      email: "s.jenkins@apexbio.com",
      phone: "+1 415 890 2234",
      notes: "Patent dispute & IP licensing counsel.",
    },
    {
      id: "cl_3",
      name: "Tariq Al-Hashimi",
      company: "Private Individual",
      email: "tariq.hashimi@outlook.com",
      phone: "+971 50 442 1199",
      notes: "Real estate title rectification and partition suit.",
    },
  ],
  matters: [
    {
      id: "mat_1",
      title: "Al-Mansoor vs. Global Freight Logistics",
      clientId: "cl_1",
      practiceArea: "Arbitration",
      advocate: "Adv. Tariq Rahman, Senior Counsel",
      status: "Active",
      filingDate: "2024-01-15",
      notes: "DIAC Arbitration Claim for breach of maritime delivery contract.",
    },
    {
      id: "mat_2",
      title: "Apex BioHealth vs. GenCore Pharma Inc.",
      clientId: "cl_2",
      practiceArea: "Intellectual Property",
      advocate: "Adv. Sarah Miller",
      status: "Pending Hearing",
      filingDate: "2024-02-01",
      notes: "Patent infringement injunction application.",
    },
    {
      id: "mat_3",
      title: "Al-Hashimi Estate Partition Suit",
      clientId: "cl_3",
      practiceArea: "Real Estate",
      advocate: "Adv. Fatima Noor",
      status: "Intake",
      filingDate: "2024-03-10",
      notes: "Inheritance properties distribution before Civil First Instance Court.",
    },
  ],
  hearings: [
    {
      id: "h_1",
      matterId: "mat_1",
      date: "2026-08-30",
      court: "Arbitration Tribunal (DIAC / ICC)",
      notes: "Cross-examination of Claimant's Quantum Expert witness.",
    },
    {
      id: "h_2",
      matterId: "mat_2",
      date: "2026-09-02",
      court: "High Court / Court of Appeal",
      notes: "Oral arguments on temporary injunction application.",
    },
    {
      id: "h_3",
      matterId: "mat_3",
      date: "2026-09-14",
      court: "District Court / Court of First Instance",
      notes: "First hearing for filing Written Statement & Preliminary Objections.",
    },
  ],
  billing: [
    {
      id: "b_1",
      matterId: "mat_1",
      description: "Arbitration Filing & Statement of Claim drafting",
      amount: "35000",
      currency: "AED",
      date: "2024-02-15",
      status: "Paid",
    },
    {
      id: "b_2",
      matterId: "mat_2",
      description: "Senior Counsel opinion & injunction brief preparation",
      amount: "18500",
      currency: "AED",
      date: "2024-03-01",
      status: "Sent",
    },
    {
      id: "b_3",
      matterId: "mat_3",
      description: "Retainer deposit & Title verification search report",
      amount: "8000",
      currency: "AED",
      date: "2024-03-11",
      status: "Draft",
    },
  ],
};

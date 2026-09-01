export const uid = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const todayISO = () => new Date().toISOString().split("T")[0];

export const fmtDate = (d) => {
  if (!d) return "—";
  try {
    const [y, m, day] = d.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
  } catch {
    return d;
  }
};

export const daysUntil = (d) => {
  if (!d) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d + "T00:00:00");
  const diff = target.getTime() - now.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

export const fmtCurrency = (amount, currency = "AED") => {
  const num = Number(amount) || 0;
  return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export function toAppRecord(tableName, dbRow) {
  if (!dbRow) return dbRow;
  if (tableName === "clients") {
    return {
      id: dbRow.id,
      name: dbRow.name || "",
      company: dbRow.company || "",
      email: dbRow.email || "",
      phone: dbRow.phone || "",
      notes: dbRow.notes || "",
    };
  }
  if (tableName === "matters") {
    return {
      id: dbRow.id,
      title: dbRow.title || "",
      clientId: dbRow.client_id || dbRow.clientId || "",
      practiceArea: dbRow.practice_area || dbRow.practiceArea || "",
      advocate: dbRow.advocate || "",
      status: dbRow.status || "Intake",
      filingDate: dbRow.filing_date || dbRow.filingDate || "",
      notes: dbRow.notes || "",
      opposingParty: dbRow.opposing_party || dbRow.opposingParty || "",
      caseNumber: dbRow.case_number || dbRow.caseNumber || "",
      courtComplex: dbRow.court_complex || dbRow.courtComplex || "",
      priority: dbRow.priority || "Normal",
    };
  }
  if (tableName === "hearings") {
    return {
      id: dbRow.id,
      matterId: dbRow.matter_id || dbRow.matterId || "",
      date: dbRow.hearing_date || dbRow.date || "",
      court: dbRow.court || "",
      notes: dbRow.notes || "",
      outcome: dbRow.outcome || "",
      orderNotes: dbRow.order_notes || dbRow.orderNotes || "",
    };
  }
  if (tableName === "billing") {
    return {
      id: dbRow.id,
      matterId: dbRow.matter_id || dbRow.matterId || "",
      matterLabel: dbRow.matter_label || dbRow.matterLabel || "",
      description: dbRow.description || "",
      amount: dbRow.amount?.toString() || "0",
      currency: dbRow.currency || "AED",
      date: dbRow.invoice_date || dbRow.date || "",
      status: dbRow.status || "Draft",
    };
  }
  return dbRow;
}

export function toDbRecord(tableName, appRecord) {
  if (!appRecord) return appRecord;
  if (tableName === "clients") {
    return {
      id: appRecord.id,
      name: appRecord.name,
      company: appRecord.company || null,
      email: appRecord.email || null,
      phone: appRecord.phone || null,
      notes: appRecord.notes || null,
    };
  }
  if (tableName === "matters") {
    return {
      id: appRecord.id,
      title: appRecord.title,
      client_id: appRecord.clientId || null,
      practice_area: appRecord.practiceArea || null,
      advocate: appRecord.advocate || null,
      status: appRecord.status || "Intake",
      filing_date: appRecord.filingDate || null,
      notes: appRecord.notes || null,
      opposing_party: appRecord.opposingParty || null,
      case_number: appRecord.caseNumber || null,
      court_complex: appRecord.courtComplex || null,
      priority: appRecord.priority || "Normal",
    };
  }
  if (tableName === "hearings") {
    return {
      id: appRecord.id,
      matter_id: appRecord.matterId || null,
      hearing_date: appRecord.date,
      court: appRecord.court || null,
      notes: appRecord.notes || null,
      outcome: appRecord.outcome || null,
      order_notes: appRecord.orderNotes || null,
    };
  }
  if (tableName === "billing") {
    return {
      id: appRecord.id,
      matter_id: appRecord.matterId || null,
      matter_label: appRecord.matterLabel || null,
      description: appRecord.description,
      amount: Number(appRecord.amount) || 0,
      currency: appRecord.currency || "AED",
      invoice_date: appRecord.date,
      status: appRecord.status || "Draft",
    };
  }
  return appRecord;
}

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
    const str = typeof d === "string" ? d : (d instanceof Date ? d.toISOString().split("T")[0] : String(d));
    const parts = str.split("T")[0].split("-");
    if (parts.length < 3) return str;
    const [y, m, day] = parts;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIdx = parseInt(m, 10) - 1;
    if (monthIdx < 0 || monthIdx > 11) return str;
    return `${parseInt(day, 10)} ${months[monthIdx]} ${y}`;
  } catch {
    return typeof d === "string" ? d : "—";
  }
};

export const daysUntil = (d) => {
  if (!d) return 0;
  try {
    const str = typeof d === "string" ? d : (d instanceof Date ? d.toISOString() : String(d));
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(str.includes("T") ? str : `${str}T00:00:00`);
    if (isNaN(target.getTime())) return 0;
    const diff = target.getTime() - now.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

export const fmtCurrency = (amount, currency = "AED") => {
  try {
    const num = Number(amount) || 0;
    return `${currency || "AED"} ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  } catch {
    return `${currency || "AED"} ${amount || 0}`;
  }
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
      court: dbRow.court || dbRow.court_complex || "",
      courtComplex: dbRow.court_complex || dbRow.court || "",
      priority: dbRow.priority || "Normal",
      deadlineDate: dbRow.deadline_date || dbRow.deadlineDate || "",
      deadlineType: dbRow.deadline_type || dbRow.deadlineType || "",
      deadlineStatute: dbRow.deadline_statute || dbRow.deadlineStatute || "",
      deadlineNotes: dbRow.deadline_notes || dbRow.deadlineNotes || "",
      deadlineCompleted: dbRow.deadline_completed || dbRow.deadlineCompleted || false,
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

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const safeId = (id) => (uuidRegex.test(id) ? id : uid());
  const recordId = safeId(appRecord.id);

  if (tableName === "clients") {
    return {
      id: recordId,
      name: appRecord.name,
      company: appRecord.company || null,
      email: appRecord.email || null,
      phone: appRecord.phone || null,
      notes: appRecord.notes || null,
    };
  }
  if (tableName === "matters") {
    return {
      id: recordId,
      title: appRecord.title,
      client_id: appRecord.clientId && uuidRegex.test(appRecord.clientId) ? appRecord.clientId : null,
      practice_area: appRecord.practiceArea || null,
      advocate: appRecord.advocate || null,
      status: appRecord.status || "Intake",
      filing_date: appRecord.filingDate || null,
      notes: appRecord.notes || null,
      opposing_party: appRecord.opposingParty || null,
      case_number: appRecord.caseNumber || null,
      court_complex: appRecord.court || appRecord.courtComplex || null,
      priority: appRecord.priority || "Normal",
    };
  }
  if (tableName === "hearings") {
    return {
      id: recordId,
      matter_id: appRecord.matterId && uuidRegex.test(appRecord.matterId) ? appRecord.matterId : null,
      hearing_date: appRecord.date,
      court: appRecord.court || null,
      notes: appRecord.notes || null,
      outcome: appRecord.outcome || "Scheduled",
      order_notes: appRecord.orderNotes || null,
    };
  }
  if (tableName === "billing") {
    return {
      id: recordId,
      matter_id: appRecord.matterId && uuidRegex.test(appRecord.matterId) ? appRecord.matterId : null,
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

export function printElement(elementId, title = "Chambers Practice Document") {
  const elem = document.getElementById(elementId);
  if (!elem) {
    window.print();
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.zIndex = "-9999";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 16mm 14mm; }
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'IBM Plex Sans', 'Segoe UI', Roboto, 'Times New Roman', serif;
            color: #1C2333; 
            background: #FFFFFF !important;
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table { border-collapse: collapse; width: 100%; }
          th, td { text-align: left; }
          .no-print, .rowbtn { display: none !important; }
        </style>
      </head>
      <body>
        ${elem.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow.print();
    } catch (e) {
      window.print();
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 250);
}

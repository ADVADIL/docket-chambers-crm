import { fmtDate, fmtCurrency } from "./utils";

/**
 * Clean phone numbers to international standard format for wa.me links
 * e.g., "+971 50 123 4567" -> "971501234567"
 * "9876543210" -> "919876543210"
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned.slice(1);
  }
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
}

export function buildWhatsAppUrl(phone, text) {
  const number = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(text || "");
  if (number) {
    return `https://wa.me/${number}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function buildMailtoUrl(email, subject, body) {
  const encSubject = encodeURIComponent(subject || "Chambers Case Update");
  const encBody = encodeURIComponent(body || "");
  return `mailto:${email || ""}?subject=${encSubject}&body=${encBody}`;
}

export const COMM_TEMPLATES = [
  {
    id: "hearing_reminder",
    title: "Upcoming Hearing Notice",
    description: "Notify client of upcoming court listing, bench, and required attendance.",
    subject: (data) => `Court Hearing Listing Notice: ${data.matterTitle || "Your Matter"}`,
    generate: (data) => {
      const advocate = data.advocate || "Advocate-on-Record / Chambers Counsel";
      return [
        `🏛️ *COURT LISTING & HEARING NOTICE*`,
        `Chambers of ${advocate}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear ${data.clientName || "Valued Client"},`,
        ``,
        `Please be advised that your legal matter is listed before the Court as follows:`,
        ``,
        `📌 *Matter:* ${data.matterTitle || "—"}`,
        data.caseNumber ? `🔢 *Case No:* ${data.caseNumber}` : null,
        `📅 *Listing Date:* ${fmtDate(data.date)}`,
        `⚖️ *Court / Forum:* ${data.court || "Hon'ble Court"}`,
        data.notes ? `📝 *Purpose / Stage:* ${data.notes}` : null,
        ``,
        `Kindly ensure all relevant records and instructions are updated with our chambers prior to the listing. We will appear on your behalf and keep you apprised of the court order.`,
        ``,
        `Warm regards,`,
        `${advocate}`,
        `_Sent via Docket Chambers Practice Manager_`
      ].filter(Boolean).join("\n");
    }
  },
  {
    id: "hearing_outcome",
    title: "Post-Hearing Outcome & NDOH",
    description: "Brief client on today's court order and next date of hearing (NDOH).",
    subject: (data) => `Hearing Outcome & Next Date: ${data.matterTitle || "Your Matter"}`,
    generate: (data) => {
      const advocate = data.advocate || "Advocate-on-Record / Chambers Counsel";
      return [
        `⚖️ *CHAMBERS HEARING OUTCOME BRIEF*`,
        `Chambers of ${advocate}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear ${data.clientName || "Valued Client"},`,
        ``,
        `Your matter was called for hearing today before the Court:`,
        ``,
        `📌 *Matter:* ${data.matterTitle || "—"}`,
        data.caseNumber ? `🔢 *Case No:* ${data.caseNumber}` : null,
        `🏛️ *Court:* ${data.court || "Hon'ble Court"}`,
        `📋 *Proceedings / Order Passed:* ${data.outcome || data.notes || "Matter heard and argued. Next directions issued."}`,
        data.nextDate ? `📅 *Next Date of Hearing (NDOH):* ${fmtDate(data.nextDate)}` : null,
        data.nextAction ? `⚡ *Chambers Action Required:* ${data.nextAction}` : null,
        ``,
        `A certified copy of the order / cause list will be updated in your case record. Please feel free to reach out if you have any questions.`,
        ``,
        `Warm regards,`,
        `${advocate}`,
        `_Sent via Docket Chambers Practice Manager_`
      ].filter(Boolean).join("\n");
    }
  },
  {
    id: "cause_list_digest",
    title: "Chambers Daily Cause List Digest",
    description: "Summary of listed court hearings for the chamber team and clients.",
    subject: (data) => `Chambers Daily Cause List: ${fmtDate(data.date)}`,
    generate: (data) => {
      const list = data.hearings || [];
      const lines = [
        `📋 *CHAMBERS DAILY CAUSE LIST*`,
        `📅 *Date:* ${fmtDate(data.date)}`,
        `🏛️ Total Matters Listed: ${list.length}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ];

      if (list.length === 0) {
        lines.push(`No hearings scheduled for this date.`);
      } else {
        list.forEach((h, idx) => {
          lines.push(
            `\n*${idx + 1}. ${h.matterTitle || "Untitled Matter"}*`,
            `   • Bench: ${h.court || "General Court"}`,
            h.notes ? `   • Stage/Notes: ${h.notes}` : null,
          );
        });
      }

      lines.push(
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `_Prepared by Docket Chambers Manager_`
      );

      return lines.filter(Boolean).join("\n");
    }
  },
  {
    id: "fee_reminder",
    title: "Professional Fee Note & Payment",
    description: "Send fee invoice notice or overdue retainer reminder.",
    subject: (data) => `Professional Fee Note / Payment Reminder: ${data.matterTitle || "Legal Services"}`,
    generate: (data) => {
      const advocate = data.advocate || "Chambers Finance Desk";
      return [
        `💼 *PROFESSIONAL FEE NOTE & INVOICE REMINDER*`,
        `Chambers of ${advocate}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear ${data.clientName || "Valued Client"},`,
        ``,
        `This is a courteous reminder regarding professional fee statement for legal representation:`,
        ``,
        `📌 *Matter:* ${data.matterTitle || "Legal Consultation / Representation"}`,
        `📄 *Description:* ${data.description || "Professional services rendered"}`,
        `💰 *Outstanding Amount:* ${fmtCurrency(data.amount || 0, data.currency || "AED")}`,
        data.date ? `🗓️ *Invoice Date:* ${fmtDate(data.date)}` : null,
        `📊 *Status:* ${data.status || "Pending Payment"}`,
        ``,
        `Kindly remit the payment to our chambers account at your earliest convenience. If you have already remitted this payment, please share the transaction reference.`,
        ``,
        `Thank you for your trust and continued engagement.`,
        ``,
        `Sincerely,`,
        `${advocate}`,
        `_Sent via Docket Chambers Practice Manager_`
      ].filter(Boolean).join("\n");
    }
  },
  {
    id: "custom_advisory",
    title: "General Chamber Advisory",
    description: "Custom memo or legal advice update for the client.",
    subject: (data) => `Chambers Legal Advisory: ${data.matterTitle || "Matter Update"}`,
    generate: (data) => {
      const advocate = data.advocate || "Advocate-on-Record";
      return [
        `🏛️ *LEGAL ADVISORY & CASE UPDATE*`,
        `Chambers of ${advocate}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear ${data.clientName || "Valued Client"},`,
        ``,
        `Regarding your matter *${data.matterTitle || "under our representation"}*:`,
        ``,
        `${data.customMessage || "We have reviewed the recent case filings and wish to advise you on the next strategic steps."}`,
        ``,
        `Please feel free to arrange a conference at our chambers should you require any clarification.`,
        ``,
        `Warm regards,`,
        `${advocate}`,
        `_Docket Chambers Practice Manager_`
      ].join("\n");
    }
  }
];

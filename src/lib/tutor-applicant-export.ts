export type ApplicantExportRow = Record<string, unknown> & {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  subjects: string[];
};

function csvCell(value: unknown): string {
  let text = Array.isArray(value) ? value.join("; ")
    : value !== null && typeof value === "object" ? JSON.stringify(value)
    : String(value ?? "");
  // Stop spreadsheet formulas; preserve phone prefixes and leading zeros.
  if (/^[\s]*[=+@-]/.test(text) || /^[\s]*[\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function applicantCsv(rows: ApplicantExportRow[]): string {
  const first = ["full_name", "phone", "email", "subjects"];
  const columns = [...first, ...Array.from(new Set(rows.flatMap(Object.keys))).filter((key) => !first.includes(key)).sort()];
  const labels: Record<string, string> = { full_name: "Name", phone: "Phone", email: "Email", subjects: "Subjects" };
  return "\uFEFF" + [columns.map((key) => csvCell(labels[key] ?? key.replace(/_/g, " "))).join(","),
    ...rows.map((row) => columns.map((key) => csvCell(key === "phone" && row[key] ? `'${String(row[key]).replace(/^'/, "")}` : row[key])).join(","))].join("\r\n");
}

export function downloadApplicantCsv(rows: ApplicantExportRow[]) {
  const url = URL.createObjectURL(new Blob([applicantCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `tutor-applicants-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
/**
 * Parse registrant IDs from CSV/TSV exported from this app (or a single column of IDs).
 * Supports UTF-8 BOM, optional first line `sep=,` / `sep=;` (Excel), comma, semicolon, or tab delimiter, quoted cells.
 */

function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  if (text.startsWith("\uFEFF")) return text.slice(1);
  return text;
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;
  const dLen = delimiter.length;
  while (i < line.length) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }
    if (!inQuotes && line.slice(i, i + dLen) === delimiter) {
      out.push(cur);
      cur = "";
      i += dLen;
      continue;
    }
    cur += c;
    i++;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Pick the strongest separator on the line (Excel EU often uses `;`). */
function detectDelimiter(line: string): string {
  const tabCount = (line.match(/\t/g) ?? []).length;
  const semiCount = (line.match(/;/g) ?? []).length;
  const commaCount = (line.match(/,/g) ?? []).length;
  const max = Math.max(tabCount, semiCount, commaCount);
  if (max === 0) return ",";
  if (tabCount === max) return "\t";
  if (semiCount === max) return ";";
  return ",";
}

/** Excel “sep=,” / “sep=;” first line — returns delimiter char or null. */
function parseExcelSepLine(line: string): string | null {
  const t = line.trim();
  const m = /^sep=(.)$/i.exec(t);
  return m?.[1] ?? null;
}

function normalizeCell(s: string): string {
  return s.replace(/^"|"$/g, "").trim();
}

/**
 * Returns unique registrant IDs in file order (non-empty).
 */
export function parseRegistrantIdsFromRecipientImportText(text: string): {
  ids: string[];
  error: string | null;
} {
  const raw = stripBom(text).trim();
  if (!raw) {
    return { ids: [], error: "File is empty." };
  }

  let lines = raw.split(/\r\n|\n|\r/).filter((l) => l.length > 0);
  if (lines.length === 0) {
    return { ids: [], error: "File is empty." };
  }

  let delim: string;
  const sepChar = parseExcelSepLine(lines[0]);
  if (lines[0].trim().toLowerCase().startsWith("sep=")) {
    delim = sepChar ?? detectDelimiter(lines[1] ?? "");
    lines = lines.slice(1);
  } else {
    delim = detectDelimiter(lines[0]);
  }
  if (lines.length === 0) {
    return { ids: [], error: "No data rows after separator line." };
  }
  const firstRowCells = splitDelimitedLine(lines[0], delim).map(normalizeCell);
  const hasHeaderRow = firstRowCells.some((h) => /^registrant id$/i.test(h));
  let idCol = firstRowCells.findIndex((h) => /^registrant id$/i.test(h));
  if (idCol < 0) idCol = 0;
  const startRow = hasHeaderRow ? 1 : 0;

  const seen = new Set<string>();
  const ids: string[] = [];

  for (let r = startRow; r < lines.length; r++) {
    const cells = splitDelimitedLine(lines[r], delim).map(normalizeCell);
    const ref = cells[idCol] ?? "";
    if (!ref || ref === "—") continue;
    if (seen.has(ref)) continue;
    seen.add(ref);
    ids.push(ref);
  }

  if (ids.length === 0) {
    return {
      ids: [],
      error: "No registrant IDs found. Use a column named “Registrant ID” or put IDs in the first column.",
    };
  }

  return { ids, error: null };
}

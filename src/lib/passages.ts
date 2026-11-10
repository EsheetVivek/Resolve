/**
 * Splits a policy written in simple Markdown into citable passages:
 *   ## 2. Duplicate charges        → section 2
 *   Each line (or list item)        → §2.1, §2.2, …   one statement per citation
 * Labels are stable for a given text, so "Billing §2.1" always means the same words in that version.
 */
export interface Passage { label: string; heading: string; text: string; ord: number }

export function splitPolicy(title: string, body: string): Passage[] {
  const out: Passage[] = [];
  let section = 0;
  let heading = title;
  let item = 0;
  let para: string[] = [];
  const used = new Set<string>();
  const flush = () => {
    const text = para.join(" ").replace(/\s+/g, " ").trim();
    para = [];
    if (!text) return;
    item += 1;
    // Text before the first heading is the preamble (§0.n). Labels are made unique even if a
    // document repeats a section number, so a citation can never point at two passages.
    let label = `${title} §${section}.${item}`;
    for (let n = 2; used.has(label); n++) label = `${title} §${section}.${item}-${n}`;
    used.add(label);
    out.push({ label, heading: section === 0 ? title : heading, text, ord: out.length });
  };
  for (const raw of body.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    const h = line.match(/^#{1,3}\s+(?:(\d+)[.)]\s*)?(.+)$/);
    if (h) {
      flush();
      section = h[1] ? Number(h[1]) : section + 1;
      heading = h[2].trim();
      item = 0;
      continue;
    }
    if (!line) continue;
    const li = line.match(/^(?:[-*]|\d+[.)])\s+(.*)$/);
    para.push(li ? li[1] : line);
    flush();
  }
  flush();
  return out;
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "policy";
}

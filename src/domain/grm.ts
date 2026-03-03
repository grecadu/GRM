import { ActiveContractRow, MusicContract, PartnerUsage } from './types';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function isDateInRange(effectiveDate: string, startDate: string, endDate?: string): boolean {
  if (effectiveDate < startDate) return false;
  if (endDate && effectiveDate > endDate) return false;
  return true;
}

export function getPartners(partners: PartnerUsage[]): string[] {
  const map = new Map<string, string>(); 
  for (const p of partners) {
    const key = norm(p.partner);
    if (!map.has(key)) map.set(key, p.partner.trim());
  }
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

export function getActiveContractsForPartner(
  music: MusicContract[],
  partners: PartnerUsage[],
  partnerName: string,
  effectiveDate: string
): ActiveContractRow[] {
  const partnerKey = norm(partnerName);
  if (!partnerKey) return [];
  if (!ISO_DATE_RE.test(effectiveDate)) return [];

  const allowedUsage = new Map<string, string>();
  for (const p of partners) {
    if (norm(p.partner) !== partnerKey) continue;
    const usageKey = norm(p.usage);
    if (!usageKey) continue;
    if (!allowedUsage.has(usageKey)) allowedUsage.set(usageKey, p.usage.trim());
  }
  if (allowedUsage.size === 0) return [];

  const rows: ActiveContractRow[] = [];

  for (const c of music) {
    if (!isDateInRange(effectiveDate, c.startDate, c.endDate)) continue;

    for (const u of c.usages) {
      const uKey = norm(u);
      const canonical = allowedUsage.get(uKey);
      if (!canonical) continue;

      rows.push({
        artist: c.artist,
        title: c.title,
        usage: canonical,
        startDate: c.startDate,
        endDate: c.endDate,
      });
    }
  }

  rows.sort((a, b) => {
    const byArtist = a.artist.localeCompare(b.artist);
    if (byArtist !== 0) return byArtist;
    const byTitle = a.title.localeCompare(b.title);
    if (byTitle !== 0) return byTitle;
    return a.usage.localeCompare(b.usage);
  });

  return rows;
}
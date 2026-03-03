import { MusicContract, PartnerUsage } from './types';

function nonEmptyLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function assertHeader(actual: string[], expected: string[], fileLabel: string) {
  const norm = (s: string) => s.trim().toLowerCase();
  const a = actual.map(norm);
  const e = expected.map(norm);
  const ok = a.length === e.length && a.every((x, i) => x === e[i]);
  if (!ok) {
    throw new Error(
      `${fileLabel}: invalid header. Expected "${expected.join('|')}" but got "${actual.join('|')}"`
    );
  }
}

function assertValidIsoDate(value: string, label: string, lineNo: number) {
  const v = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    throw new Error(`${label}: invalid date "${value}" on line ${lineNo}. Expected YYYY-MM-DD`);
  }
  const [y, m, d] = v.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    throw new Error(`${label}: invalid date "${value}" on line ${lineNo}.`);
  }
  return v;
}

function parseDateOrEmpty(value: string, label: string, lineNo: number): string | undefined {
  const v = value.trim();
  if (v === '') return undefined;
  return assertValidIsoDate(v, label, lineNo);
}

export function parseMusicContracts(text: string): MusicContract[] {
  const lines = nonEmptyLines(text);
  if (lines.length === 0) return [];

  const header = lines[0].split('|').map((x) => x.trim());
  assertHeader(header, ['Artist', 'Title', 'Usages', 'StartDate', 'EndDate'], 'Music contracts');

  const contracts: MusicContract[] = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const parts = lines[i].split('|');
    if (parts.length !== 5) {
      throw new Error(
        `Music contracts: expected 5 columns on line ${lineNo}, got ${parts.length}`
      );
    }

    const [artistRaw, titleRaw, usagesRaw, startRaw, endRaw] = parts.map((p) => p.trim());
    if (!artistRaw || !titleRaw || !usagesRaw || !startRaw) {
      throw new Error(`Music contracts: missing required field on line ${lineNo}`);
    }

    const startDate = assertValidIsoDate(startRaw, 'Music contracts', lineNo);
    const endDate = parseDateOrEmpty(endRaw, 'Music contracts', lineNo);

    if (endDate && endDate < startDate) {
      throw new Error(`Music contracts: EndDate before StartDate on line ${lineNo}`);
    }

    const usages = usagesRaw
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (usages.length === 0) {
      throw new Error(`Music contracts: Usages required on line ${lineNo}`);
    }

    contracts.push({
      artist: artistRaw,
      title: titleRaw,
      usages,
      startDate,
      endDate,
    });
  }

  return contracts;
}

export function parsePartnerContracts(text: string): PartnerUsage[] {
  const lines = nonEmptyLines(text);
  if (lines.length === 0) return [];

  const header = lines[0].split('|').map((x) => x.trim());
  assertHeader(header, ['Partner', 'Usage'], 'Partner contracts');

  const rows: PartnerUsage[] = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const parts = lines[i].split('|');
    if (parts.length !== 2) {
      throw new Error(
        `Partner contracts: expected 2 columns on line ${lineNo}, got ${parts.length}`
      );
    }
    const [partnerRaw, usageRaw] = parts.map((p) => p.trim());
    if (!partnerRaw || !usageRaw) {
      throw new Error(`Partner contracts: missing required field on line ${lineNo}`);
    }
    rows.push({ partner: partnerRaw, usage: usageRaw });
  }

  return rows;
}
import { useEffect, useMemo, useState } from 'react';
import { parseMusicContracts, parsePartnerContracts } from './domain/parsers';
import { getActiveContractsForPartner, getPartners } from './domain/grm';
import type { ActiveContractRow, MusicContract, PartnerUsage } from './domain/types';

async function readTextFile(file: File): Promise<string> {
  return file.text();
}

async function fetchText(path: string): Promise<string> {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.text();
}

type ParseResult<T> = { value: T; error: string | null };

function safeParse<T>(fn: () => T, fallback: T): ParseResult<T> {
  try {
    return { value: fn(), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { value: fallback, error: msg };
  }
}

export default function App() {
  const [musicText, setMusicText] = useState('');
  const [partnerText, setPartnerText] = useState('');

  const [musicFilename, setMusicFilename] = useState<string>('No file chosen');
  const [partnerFilename, setPartnerFilename] = useState<string>('No file chosen');

  const [partner, setPartner] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('2012-03-01');

  const [loadError, setLoadError] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [rows, setRows] = useState<ActiveContractRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const parsed = useMemo(() => {
    const musicRes = musicText
      ? safeParse<MusicContract[]>(() => parseMusicContracts(musicText), [])
      : ({ value: [] as MusicContract[], error: null } as ParseResult<MusicContract[]>);

    const partnerRes = partnerText
      ? safeParse<PartnerUsage[]>(() => parsePartnerContracts(partnerText), [])
      : ({ value: [] as PartnerUsage[], error: null } as ParseResult<PartnerUsage[]>);

    const err = musicRes.error ?? partnerRes.error;
    return { music: musicRes.value, partners: partnerRes.value, error: err };
  }, [musicText, partnerText]);

  useEffect(() => {
    setParseError(parsed.error);
  }, [parsed.error]);

  useEffect(() => {
    setRows([]);
    setHasSearched(false);
    setSearchError(null);
  }, [musicText, partnerText]);

  const partnerOptions = useMemo(() => getPartners(parsed.partners), [parsed.partners]);

  const canSearch =
    !parseError &&
    parsed.music.length > 0 &&
    parsed.partners.length > 0 &&
    partner.trim().length > 0 &&
    effectiveDate.trim().length > 0;

  async function onLoadSample() {
    try {
      setLoadError(null);
      setSearchError(null);

      const [m, p] = await Promise.all([
        fetchText('/sample-music-contracts.txt'),
        fetchText('/sample-partners.txt'),
      ]);

      setMusicText(m);
      setPartnerText(p);

      setMusicFilename('sample-music-contracts.txt');
      setPartnerFilename('sample-partners.txt');

      setPartner('ITunes');
      setEffectiveDate('2012-03-01');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onFileChange(
    kind: 'music' | 'partner',
    setter: (v: string) => void,
    file?: File
  ) {
    try {
      setLoadError(null);
      setSearchError(null);
      if (!file) return;

      const txt = await readTextFile(file);
      setter(txt);

      if (kind === 'music') setMusicFilename(file.name);
      else setPartnerFilename(file.name);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }

  function onSearch() {
    try {
      setSearchError(null);
      setHasSearched(true);

      const result = getActiveContractsForPartner(
        parsed.music,
        parsed.partners,
        partner,
        effectiveDate
      );

      const sorted = [...result].sort((a, b) => {
        const byArtist = a.artist.localeCompare(b.artist);
        if (byArtist !== 0) return byArtist;
        const byTitle = a.title.localeCompare(b.title);
        if (byTitle !== 0) return byTitle;
        return a.usage.localeCompare(b.usage);
      });

      setRows(sorted);
    } catch (e) {
      setRows([]);
      setSearchError(e instanceof Error ? e.message : String(e));
    }
  }

  const combinedError = loadError ?? parseError ?? searchError;

  return (
    <div className="container">
      <h1>RR - Global Rights Management</h1>

      <div className="card">
        <div className="row" style={{ alignItems: 'end' }}>
          <div className="col">
            <label>Music Contracts file</label>
            <div className="fileField">
              <input
                id="musicFile"
                className="fileInput"
                aria-label="Music Contracts file"
                type="file"
                accept=".txt"
                onChange={(e) => onFileChange('music', setMusicText, e.target.files?.[0])}
              />
              <label className="fileButton" htmlFor="musicFile">
                Choose file
              </label>
              <span className="fileName" title={musicFilename}>
                {musicFilename}
              </span>
            </div>
            <div className="help">Pipe separated (Artist|Title|Usages|StartDate|EndDate)</div>
          </div>

          <div className="col">
            <label>Partner Contracts file</label>
            <div className="fileField">
              <input
                id="partnerFile"
                className="fileInput"
                aria-label="Partner Contracts file"
                type="file"
                accept=".txt"
                onChange={(e) => onFileChange('partner', setPartnerText, e.target.files?.[0])}
              />
              <label className="fileButton" htmlFor="partnerFile">
                Choose file
              </label>
              <span className="fileName" title={partnerFilename}>
                {partnerFilename}
              </span>
            </div>
            <div className="help">Pipe separated (Partner|Usage)</div>
          </div>

          <div className="col" style={{ flex: '0 0 auto', marginBottom: '25px' }}>
            <button type="button" onClick={onLoadSample}>
              Load sample data
            </button>
          </div>
        </div>

        <h2>Inputs</h2>
        <div className="row">
          <div className="col">
            <label htmlFor="partner">Partner</label>
            <select
              id="partner"
              aria-label="Partner"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              disabled={partnerOptions.length === 0}
            >
              <option value="" disabled>
                {partnerOptions.length ? 'Select a partner' : 'Upload partner file or load sample'}
              </option>
              {partnerOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="col">
            <label htmlFor="effectiveDate">Effective date</label>
            <input
              id="effectiveDate"
              aria-label="Effective date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>

          <div className="col" style={{ flex: '0 0 auto' }}>
            <button type="button" className="primary" onClick={onSearch} disabled={!canSearch}>
              Search
            </button>
          </div>
        </div>

        {combinedError ? (
          <div className="error" role="alert" aria-live="polite">
            {combinedError}
          </div>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Active contracts</h2>
        <div className="small">
          Showing contracts active on <b>{effectiveDate || '(no date)'}</b> for partner{' '}
          <b>{partner || '(no partner)'}</b>.
        </div>

        <table aria-label="Results table">
          <thead>
            <tr>
              <th>Artist</th>
              <th>Title</th>
              <th>Usages</th>
              <th>StartDate</th>
              <th>EndDate</th>
            </tr>
          </thead>
          <tbody>
            {!hasSearched ? (
              <tr>
                <td colSpan={5} className="small">
                  No results yet. Upload files (or load sample), select inputs, and Search.
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="small">
                  No active contracts found for that partner/date.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={`${r.artist}||${r.title}||${r.usage}||${r.startDate}||${r.endDate ?? ''}`}>
                  <td>{r.artist}</td>
                  <td>{r.title}</td>
                  <td>{r.usage}</td>
                  <td>{r.startDate}</td>
                  <td>{r.endDate ?? ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <details className="card cardMuted" style={{ marginTop: 16 }}>
        <summary className="summary">Raw inputs (debug)</summary>
        <div className="row" style={{ marginTop: 12 }}>
          <div className="col">
            <label>Music Contracts text</label>
            <textarea
              aria-label="Music Contracts text"
              value={musicText}
              onChange={(e) => setMusicText(e.target.value)}
              placeholder="Paste Music Contracts file content here..."
            />
          </div>
          <div className="col">
            <label>Partner Contracts text</label>
            <textarea
              aria-label="Partner Contracts text"
              value={partnerText}
              onChange={(e) => setPartnerText(e.target.value)}
              placeholder="Paste Partner Contracts file content here..."
            />
          </div>
        </div>
      </details>
    </div>
  );
}
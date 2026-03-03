import { describe, expect, it } from 'vitest';
import { parseMusicContracts, parsePartnerContracts } from '../domain/parsers';
import { getActiveContractsForPartner } from '../domain/grm';

const musicText = `Artist|Title|Usages|StartDate|EndDate
Tinie Tempah|Frisky (Live from SoHo)|digital download, streaming|2012-02-01|
Tinie Tempah|Miami 2 Ibiza|digital download|2012-02-01|
Tinie Tempah|Till I'm Gone|digital download|2012-08-01|
Monkey Claw|Black Mountain|digital download|2012-02-01|
Monkey Claw|Iron Horse|digital download, streaming|2012-06-01|
Monkey Claw|Motor Mouth|digital download, streaming|2011-03-01|
Monkey Claw|Christmas Special|streaming|2012-12-25|2012-12-31
`;

const partnerText = `Partner|Usage
ITunes|digital download
YouTube|streaming
`;

describe('GRM scenarios (from spec)', () => {
  it('Scenario 1: ITunes 2012-03-01', () => {
    const music = parseMusicContracts(musicText);
    const partners = parsePartnerContracts(partnerText);

    const rows = getActiveContractsForPartner(music, partners, 'ITunes', '2012-03-01');

    expect(rows).toEqual([
      { artist: 'Monkey Claw', title: 'Black Mountain', usage: 'digital download', startDate: '2012-02-01', endDate: undefined },
      { artist: 'Monkey Claw', title: 'Motor Mouth', usage: 'digital download', startDate: '2011-03-01', endDate: undefined },
      { artist: 'Tinie Tempah', title: 'Frisky (Live from SoHo)', usage: 'digital download', startDate: '2012-02-01', endDate: undefined },
      { artist: 'Tinie Tempah', title: 'Miami 2 Ibiza', usage: 'digital download', startDate: '2012-02-01', endDate: undefined },
    ]);
  });

  it('Scenario 2: YouTube 2012-12-27', () => {
    const music = parseMusicContracts(musicText);
    const partners = parsePartnerContracts(partnerText);

    const rows = getActiveContractsForPartner(music, partners, 'YouTube', '2012-12-27');

    expect(rows).toEqual([
      { artist: 'Monkey Claw', title: 'Christmas Special', usage: 'streaming', startDate: '2012-12-25', endDate: '2012-12-31' },
      { artist: 'Monkey Claw', title: 'Iron Horse', usage: 'streaming', startDate: '2012-06-01', endDate: undefined },
      { artist: 'Monkey Claw', title: 'Motor Mouth', usage: 'streaming', startDate: '2011-03-01', endDate: undefined },
      { artist: 'Tinie Tempah', title: 'Frisky (Live from SoHo)', usage: 'streaming', startDate: '2012-02-01', endDate: undefined },
    ]);
  });

  it('Scenario 3: YouTube 2012-04-01', () => {
    const music = parseMusicContracts(musicText);
    const partners = parsePartnerContracts(partnerText);

    const rows = getActiveContractsForPartner(music, partners, 'YouTube', '2012-04-01');

    expect(rows).toEqual([
      { artist: 'Monkey Claw', title: 'Motor Mouth', usage: 'streaming', startDate: '2011-03-01', endDate: undefined },
      { artist: 'Tinie Tempah', title: 'Frisky (Live from SoHo)', usage: 'streaming', startDate: '2012-02-01', endDate: undefined },
    ]);
  });
});

describe('Parsing validation', () => {
  it('Rejects wrong headers', () => {
    expect(() => parsePartnerContracts('A|B\n1|2')).toThrow(/invalid header/i);
  });

  it('Allows empty EndDate', () => {
    const music = parseMusicContracts(`Artist|Title|Usages|StartDate|EndDate
A|B|streaming|2012-01-01|
`);
    expect(music[0].endDate).toBeUndefined();
  });
});

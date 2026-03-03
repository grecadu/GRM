import { describe, expect, it } from "vitest";
import { parseMusicContracts, parsePartnerContracts } from "../domain/parsers";


describe("parsers.ts", () => {
  it("returns [] for empty text", () => {
    expect(parseMusicContracts("")).toEqual([]);
    expect(parsePartnerContracts("   \n\n")).toEqual([]);
  });

  it("parses music contracts", () => {
    const text = `Artist|Title|Usages|StartDate|EndDate
Monkey Claw|Black Mountain|digital download|2012-02-01|
Tinie Tempah|Frisky (Live from SoHo)|digital download, streaming|2012-02-01|
Monkey Claw|Christmas Special|streaming|2012-12-25|2012-12-31
`;

    const contracts = parseMusicContracts(text);

    expect(contracts).toHaveLength(3);

    expect(contracts[0]).toEqual({
      artist: "Monkey Claw",
      title: "Black Mountain",
      usages: ["digital download"],
      startDate: "2012-02-01",
      endDate: undefined,
    });

    expect(contracts[1]).toEqual({
      artist: "Tinie Tempah",
      title: "Frisky (Live from SoHo)",
      usages: ["digital download", "streaming"],
      startDate: "2012-02-01",
      endDate: undefined,
    });

    expect(contracts[2]).toEqual({
      artist: "Monkey Claw",
      title: "Christmas Special",
      usages: ["streaming"],
      startDate: "2012-12-25",
      endDate: "2012-12-31",
    });
  });

  it("parses partner contracts", () => {
    const text = `Partner|Usage
ITunes|digital download
YouTube|streaming
`;

    expect(parsePartnerContracts(text)).toEqual([
      { partner: "ITunes", usage: "digital download" },
      { partner: "YouTube", usage: "streaming" },
    ]);
  });

  it("throws on invalid music header", () => {
    const text = `Artist|Title|Usage|StartDate|EndDate
A|B|digital download|2012-01-01|
`;
    expect(() => parseMusicContracts(text)).toThrow(/music contracts: invalid header/i);
  });

  it("throws on invalid partner header", () => {
    const text = `Partner|Usages
ITunes|digital download
`;
    expect(() => parsePartnerContracts(text)).toThrow(/partner contracts: invalid header/i);
  });

  it("throws when music row has wrong number of columns", () => {
    const text = `Artist|Title|Usages|StartDate|EndDate
A|B|digital download|2012-01-01
`;
    expect(() => parseMusicContracts(text)).toThrow(/expected 5 columns/i);
  });

  it("throws when partner row has wrong number of columns", () => {
    const text = `Partner|Usage
ITunes|digital download|extra
`;
    expect(() => parsePartnerContracts(text)).toThrow(/expected 2 columns/i);
  });

  it("throws when required music fields are missing", () => {
    const text = `Artist|Title|Usages|StartDate|EndDate
|B|digital download|2012-01-01|
`;
    expect(() => parseMusicContracts(text)).toThrow(/missing required field/i);
  });

  it("throws on invalid date format (music)", () => {
    const text = `Artist|Title|Usages|StartDate|EndDate
A|B|digital download|2012/01/01|
`;
    expect(() => parseMusicContracts(text)).toThrow(/invalid date/i);
  });

  it("throws when EndDate is before StartDate", () => {
    const text = `Artist|Title|Usages|StartDate|EndDate
A|B|digital download|2012-05-01|2012-01-01
`;
    expect(() => parseMusicContracts(text)).toThrow(/enddate before startdate/i);
  });

  it("throws when usages are empty after parsing", () => {
    const text = `Artist|Title|Usages|StartDate|EndDate
A|B|   ,   |2012-01-01|
`;
    expect(() => parseMusicContracts(text)).toThrow(/usages required/i);
  });

  it("accepts header case/spacing differences", () => {
    const text = `  artist | title | usages | startdate | enddate
A|B|digital download|2012-01-01|
`;
    const contracts = parseMusicContracts(text);
    expect(contracts).toHaveLength(1);
  });
});
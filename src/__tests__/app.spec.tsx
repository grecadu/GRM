import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

const MUSIC = `Artist|Title|Usages|StartDate|EndDate
Tinie Tempah|Frisky (Live from SoHo)|digital download, streaming|2012-02-01|
Tinie Tempah|Miami 2 Ibiza|digital download|2012-02-01|
Tinie Tempah|Till I'm Gone|digital download|2012-08-01|
Monkey Claw|Black Mountain|digital download|2012-02-01|
Monkey Claw|Iron Horse|digital download, streaming|2012-06-01|
Monkey Claw|Motor Mouth|digital download, streaming|2011-03-01|
Monkey Claw|Christmas Special|streaming|2012-12-25|2012-12-31
`;

const PARTNERS = `Partner|Usage
ITunes|digital download
YouTube|streaming
`;

describe("App integration", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/sample-music-contracts.txt")) {
        return {
          ok: true,
          status: 200,
          text: async () => MUSIC,
        } as any;
      }

      if (url.endsWith("/sample-partners.txt")) {
        return {
          ok: true,
          status: 200,
          text: async () => PARTNERS,
        } as any;
      }

      return {
        ok: false,
        status: 404,
        text: async () => "not found",
      } as any;
    }) as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("Loads sample data and runs a search (ITunes + 2012-03-01)", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /load sample data/i }));

    const partnerSelect = await screen.findByRole("combobox", { name: /^partner$/i });
    expect(partnerSelect).not.toBeDisabled();

    await within(partnerSelect).findByRole("option", { name: "ITunes" });

    await user.selectOptions(partnerSelect, "ITunes");

    const dateInput = screen.getByLabelText(/^effective date$/i);
    await user.clear(dateInput);
    await user.type(dateInput, "2012-03-01");

    await user.click(screen.getByRole("button", { name: /^search$/i }));

    const titleCell = await screen.findByText("Black Mountain");
    const row = titleCell.closest("tr");
    expect(row).not.toBeNull();

    const rowScope = within(row!);
    expect(rowScope.getByText("Monkey Claw")).toBeInTheDocument();
    expect(rowScope.getByText("digital download")).toBeInTheDocument();
  });
});
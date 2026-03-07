import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { dbsParser } from "@/lib/parsers/dbs";
import { detectAndParse } from "@/lib/parsers/registry";
import type { RawTransaction } from "@/lib/parsers/types";
import { generateLunchMoneyCsv } from "@/lib/exporter/lunchmoney";

/** Raw CSV content loaded from sample_input.csv */
let sampleCsv: string;

/** Parsed transactions from sample CSV */
let transactions: RawTransaction[];

beforeAll(() => {
  const csvPath = path.resolve(__dirname, "../../sample_input.csv");
  sampleCsv = readFileSync(csvPath, "utf-8");
  transactions = dbsParser.parse(sampleCsv);
});

/** Find a transaction by its original description substring. */
function findTx(substr: string): RawTransaction | undefined {
  return transactions.find((t) => t.originalDescription.includes(substr));
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

describe("dbsParser.detect", () => {
  it("returns true for a valid DBS CSV", () => {
    expect(dbsParser.detect(sampleCsv)).toBe(true);
  });

  it("returns false for a non-DBS CSV", () => {
    const otherCsv = "Date,Description,Amount\n2026-02-23,Purchase,9.30\n";
    expect(dbsParser.detect(otherCsv)).toBe(false);
  });

  it("returns false for empty content", () => {
    expect(dbsParser.detect("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Parse — overall
// ---------------------------------------------------------------------------

describe("dbsParser.parse", () => {
  it("parses all 42 data rows from sample_input.csv", () => {
    expect(transactions).toHaveLength(42);
  });

  it("throws on empty CSV content", () => {
    expect(() => dbsParser.parse("")).toThrow("CSV content is empty");
  });

  it("throws on CSV with only metadata rows and no data", () => {
    const headerOnly =
      "row1\nrow2\nrow3\nrow4\nrow5\nrow6\n" +
      "Transaction Date,Transaction Code,Description,Transaction Ref1,Transaction Ref2,Transaction Ref3,Status,Debit Amount,Credit Amount\n";
    expect(() => dbsParser.parse(headerOnly)).toThrow("No transaction rows");
  });
});

// ---------------------------------------------------------------------------
// Date parsing
// ---------------------------------------------------------------------------

describe("date parsing", () => {
  it('parses "23 Feb 2026" correctly', () => {
    const tx = transactions[0];
    expect(tx.date.getFullYear()).toBe(2026);
    expect(tx.date.getMonth()).toBe(1); // February is 0-indexed
    expect(tx.date.getDate()).toBe(23);
  });

  it('parses "09 Feb 2026" correctly', () => {
    const last = transactions[transactions.length - 1];
    expect(last.date.getFullYear()).toBe(2026);
    expect(last.date.getMonth()).toBe(1);
    expect(last.date.getDate()).toBe(9);
  });
});

// ---------------------------------------------------------------------------
// Amount parsing
// ---------------------------------------------------------------------------

describe("amount parsing", () => {
  it("parses debit as negative", () => {
    const tx = findTx("NOODLE HOUSE STALL");
    expect(tx).toBeDefined();
    expect(tx!.amount).toBe(-9.3);
  });

  it("parses credit as positive", () => {
    const tx = findTx("ALICE WONG");
    expect(tx).toBeDefined();
    expect(tx!.amount).toBe(200);
  });

  it("rounds to 2 decimal places", () => {
    const tx = findTx("BURGER KING");
    expect(tx).toBeDefined();
    expect(tx!.amount).toBe(-28.45);
  });
});

// ---------------------------------------------------------------------------
// POS cleaning
// ---------------------------------------------------------------------------

describe("POS cleaning", () => {
  it('strips "TO: " prefix and title-cases payee', () => {
    const tx = transactions[0]; // NOODLE HOUSE STALL
    expect(tx.description).toBe("Noodle House Stall");
    expect(tx.notes).toBe("");
  });

  it("handles multi-word POS merchant", () => {
    const tx = findTx("HONG KONG DIM SUM FACTORY");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Hong Kong Dim Sum Factory");
  });

  it("preserves alphanumeric merchant names", () => {
    const tx = findTx("TO: ABC1234");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Abc1234");
  });

  it("handles FISHBALL NOODLE SOUP", () => {
    const tx = findTx("FISHBALL NOODLE SOUP");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Fishball Noodle Soup");
  });

  it("handles LOCAL COFFEE SHOP", () => {
    const tx = findTx("LOCAL COFFEE SHOP");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Local Coffee Shop");
  });
});

// ---------------------------------------------------------------------------
// MST cleaning
// ---------------------------------------------------------------------------

describe("MST cleaning", () => {
  it("strips acquirer suffix and title-cases", () => {
    const tx = findTx("BURGER KING");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Burger King (Xyz)");
    expect(tx!.notes).toBe("");
  });

  it("strips both acquirer suffix and numeric ref", () => {
    const busMrt = transactions.filter((t) =>
      t.originalDescription.includes("BUS/MRT"),
    );
    expect(busMrt.length).toBeGreaterThan(0);
    for (const tx of busMrt) {
      expect(tx.description).toBe("Bus/Mrt");
    }
  });

  it("handles VALUE MART GROCERIES", () => {
    const tx = findTx("VALUE MART GROCERIES");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Value Mart Groceries");
  });

  it("handles FURNITURE STORE CAFE", () => {
    const tx = findTx("FURNITURE STORE CAFE");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Furniture Store Cafe");
  });

  it("handles FastFood with numeric ref", () => {
    const tx = findTx("FastFood 123456");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Fastfood");
  });
});

// ---------------------------------------------------------------------------
// ICT cleaning — PayNow
// ---------------------------------------------------------------------------

describe("ICT PayNow cleaning", () => {
  it("cleans outgoing PayNow with user notes", () => {
    const tx = findTx("GOVERNMENT AGENCY OFFICE");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Government Agency Office");
    expect(tx!.notes).toBe("QR240219194137");
    expect(tx!.amount).toBe(-45);
  });

  it('strips default "PayNow transfer" note on incoming', () => {
    const tx = findTx("ALICE WONG");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Alice Wong");
    expect(tx!.notes).toBe("");
    expect(tx!.amount).toBe(200);
  });

  it('strips default "PayNow transfer" note on other incoming', () => {
    const tx = findTx("BOB TAN");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Bob Tan");
    expect(tx!.notes).toBe("");
    expect(tx!.amount).toBe(23);
  });

  it("preserves meaningful notes like Gong Xi Fa Cai", () => {
    const tx = findTx("CHARLIE LIM");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Charlie Lim");
    expect(tx!.notes).toBe("Gong Xi Fa Cai");
    expect(tx!.amount).toBe(255);
  });

  it("preserves notes for outgoing transfers", () => {
    const tx = findTx("DAVID CHEW");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("David Chew");
    expect(tx!.notes).toBe("mixed rice");
  });

  it("handles PayNow to business (PTE. LTD.) with notes", () => {
    const tx = findTx("OCEAN CATCH SEAFOOD");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Ocean Catch Seafood Pte. Ltd.");
    expect(tx!.notes).toBe("san lor horfun");
  });

  it("strips long reference from notes (HT7S53DNK2Z7RW99)", () => {
    const tx = findTx("STRIPE SG-PAYMENT GATE");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Stripe Sg-Payment Gate");
    expect(tx!.notes).toBe("");
  });

  it("handles payee with hyphens (SG-PAYMENT)", () => {
    const tx = findTx("STRIPE SG-PAYMENT GATE");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Stripe Sg-Payment Gate");
  });

  it("preserves user notes for Eve Low", () => {
    const tx = findTx("EVE LOW");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Eve Low");
    expect(tx!.notes).toBe("sin to urc ticket");
    expect(tx!.amount).toBe(-666);
  });

  it("handles Fiona Goh incoming PayNow", () => {
    const fionaTxs = transactions.filter((t) =>
      t.originalDescription.includes("FIONA GOH"),
    );
    expect(fionaTxs).toHaveLength(2);
    for (const tx of fionaTxs) {
      expect(tx.description).toBe("Fiona Goh");
      expect(tx.notes).toBe(""); // Default "PayNow transfer" stripped
      expect(tx.amount).toBeGreaterThan(0);
    }
  });

  it("handles George Chua with paylater notes", () => {
    const georgeTxs = transactions.filter((t) =>
      t.originalDescription.includes("GEORGE CHUA"),
    );
    expect(georgeTxs).toHaveLength(2);
    expect(georgeTxs[0].description).toBe("George Chua");
    expect(georgeTxs[0].notes).toBe("paylater debt");
    expect(georgeTxs[1].notes).toBe("pay off debts paylter");
  });

  it("strips long reference from POS-System-RetailStore notes", () => {
    const tx = findTx("POS-System-RetailStore");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Pos-System-Retailstore");
    expect(tx!.notes).toBe("");
  });

  it("keeps short QR reference in Sunrise notes", () => {
    const tx = findTx("SUNRISE");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Sunrise");
    expect(tx!.notes).toBe("QSSGQRSTAR1234");
  });
});

// ---------------------------------------------------------------------------
// ICT cleaning — External bank
// ---------------------------------------------------------------------------

describe("ICT external bank cleaning", () => {
  it("extracts bank name from external transfer", () => {
    const tx = findTx("Trus:0142345678:I-BANK");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Trus");
    expect(tx!.notes).toBe("Transfer");
    expect(tx!.amount).toBe(-100);
  });
});

// ---------------------------------------------------------------------------
// ICT — Row 38 edge case
// ---------------------------------------------------------------------------

describe("Row 38 edge case", () => {
  it("uses Ref2 (COMFORTDELGRO) not Description (CITY TAXI)", () => {
    // Reason: Description is concatenated and may be truncated. Ref2 has the
    // actual payee name which may differ from the Description.
    const tx = findTx("CITY TAXI DRIVING SCHOOL");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Comfortdelgro Driving Cen");
    expect(tx!.amount).toBe(-42);
  });
});

// ---------------------------------------------------------------------------
// ITR cleaning
// ---------------------------------------------------------------------------

describe("ITR cleaning", () => {
  it("handles PayLah! withdrawal", () => {
    const paylahTxs = transactions.filter((t) =>
      t.originalDescription.includes("PAYLAH!"),
    );
    expect(paylahTxs).toHaveLength(2);
    for (const tx of paylahTxs) {
      expect(tx.description).toBe("PayLah!");
      expect(tx.notes).toBe("Received");
      expect(tx.amount).toBeGreaterThan(0);
    }
  });

  it("has correct amounts for PayLah! withdrawals", () => {
    const paylahTxs = transactions.filter((t) =>
      t.originalDescription.includes("PAYLAH!"),
    );
    const amounts = paylahTxs.map((t) => t.amount).sort((a, b) => a - b);
    expect(amounts).toEqual([15, 23.84]);
  });
});

// ---------------------------------------------------------------------------
// PII stripping
// ---------------------------------------------------------------------------

describe("PII stripping", () => {
  it("does not include card numbers in any payee", () => {
    const cardPattern = /\d{4}-\d{4}-\d{4}-\d{4}/;
    for (const tx of transactions) {
      expect(tx.description).not.toMatch(cardPattern);
    }
  });

  it("does not include card numbers in any notes", () => {
    const cardPattern = /\d{4}-\d{4}-\d{4}-\d{4}/;
    for (const tx of transactions) {
      expect(tx.notes).not.toMatch(cardPattern);
    }
  });

  it("strips long reference from notes (M008488410010949564)", () => {
    const tx = findTx("CITY TAXI DRIVING SCHOOL");
    expect(tx).toBeDefined();
    expect(tx!.notes).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Transaction code lookup
// ---------------------------------------------------------------------------

describe("transaction code lookup", () => {
  it("resolves POS to description from dbs_codes.json", () => {
    const posTx = transactions.find((t) =>
      t.originalDescription.includes("NETS QR"),
    );
    expect(posTx).toBeDefined();
    expect(posTx!.transactionCode).toBe("Point-of-Sale Transaction or Proceeds");
  });
});

// ---------------------------------------------------------------------------
// Registry integration
// ---------------------------------------------------------------------------

describe("detectAndParse", () => {
  it("auto-detects DBS and parses correctly", () => {
    const result = detectAndParse(sampleCsv);
    expect(result).toHaveLength(42);
    expect(result[0].description).toBe("Noodle House Stall");
  });

  it("throws for unsupported CSV format", () => {
    const unknownCsv = "Date,Desc,Amt\n2026-02-23,Test,10\n";
    expect(() => detectAndParse(unknownCsv)).toThrow("Unsupported bank CSV format");
  });
});

// ---------------------------------------------------------------------------
// End-to-end integration: parse → export
// ---------------------------------------------------------------------------

describe("end-to-end: parse → export", () => {
  it("produces valid Lunch Money CSV from sample_input.csv", () => {
    const csv = generateLunchMoneyCsv(transactions);
    const lines = csv.trim().split("\n");

    // Header line
    expect(lines[0]).toBe("date,payee,amount,category,notes");

    // 42 data lines + 1 header = 43 total
    expect(lines).toHaveLength(43);

    // Spot-check first data row
    expect(lines[1]).toBe("2026-02-23,Noodle House Stall,-9.30,,");

    // Spot-check a row with notes containing commas (none in sample, but verify format)
    const burgerLine = lines.find((l) => l.includes("Burger King"));
    expect(burgerLine).toBe("2026-02-21,Burger King (Xyz),-28.45,,");
  });
});

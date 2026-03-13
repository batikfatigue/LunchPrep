import { describe, it, expect, beforeAll, vi, afterAll } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { dbsParser } from "@/lib/parsers/dbs";
import { detectAndParse } from "@/lib/parsers/registry";
import type { RawTransaction } from "@/lib/parsers/types";
import { generateLunchMoneyCsv } from "@/lib/exporter/lunchmoney";
import { buildCsv } from "@/dev-tools/pipeline-inspector/mock-csv";

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
  it("extracts bank name and suppresses OTHR purpose code", () => {
    const tx = findTx("Trus:0142345678:I-BANK");
    expect(tx).toBeDefined();
    expect(tx!.description).toBe("Trus");
    expect(tx!.notes).toBe("");
    expect(tx!.amount).toBe(-100);
  });

  it("resolves known purpose code and prepends to notes (SALA)", () => {
    const csv = buildCsv({
      code: "ICT",
      ref1: "Xfer:9876543210:I-BANK",
      ref2: "Monthly transfer",
      ref3: "SALA 20260210ABC123",
      debit: "500.00",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Xfer");
    expect(tx.notes).toBe("Salary Payment | Monthly transfer");
  });

  it("resolves INT as Intra Company Payment (DBS exception)", () => {
    const csv = buildCsv({
      code: "ICT",
      ref1: "SCL:0011223344:I-BANK",
      ref2: "Q1 Payment",
      ref3: "INT 99887766554433221100",
      debit: "1000.00",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Scl");
    expect(tx.notes).toBe("Intra Company Payment | Q1 Payment");
  });

  it("shows only purpose label when ref2 is empty", () => {
    const csv = buildCsv({
      code: "ICT",
      ref1: "Trus:0142345678:I-BANK",
      ref2: "",
      ref3: "INVS 17712569475193992000",
      debit: "200.00",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Trus");
    expect(tx.notes).toBe("Investment & Securities");
  });

  it("shows only ref2 notes when purpose code is OTHR", () => {
    const csv = buildCsv({
      code: "ICT",
      ref1: "Trus:0142345678:I-BANK",
      ref2: "Savings top-up",
      ref3: "OTHR 17712569475193992000",
      debit: "100.00",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Trus");
    expect(tx.notes).toBe("Savings top-up");
  });

  it("returns empty notes when both OTHR and ref2 empty", () => {
    const csv = buildCsv({
      code: "ICT",
      ref1: "Trus:0142345678:I-BANK",
      ref2: "",
      ref3: "OTHR 17712569475193992000",
      debit: "50.00",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Trus");
    expect(tx.notes).toBe("");
  });

  it("suppresses unknown purpose code with warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const csv = buildCsv({
      code: "ICT",
      ref1: "Xfer:9876543210:I-BANK",
      ref2: "Test note",
      ref3: "ZZZZ 12345678901234567890",
      debit: "10.00",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Xfer");
    expect(tx.notes).toBe("Test note");
    expect(warnSpy).toHaveBeenCalledWith("Unknown FAST purpose code: ZZZZ");
    warnSpy.mockRestore();
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

// ---------------------------------------------------------------------------
// parseTrace (dev-tools gate)
// ---------------------------------------------------------------------------

describe("parseTrace", () => {
  it("is absent when NEXT_PUBLIC_DEV_TOOLS is not set", () => {
    // Default env — dev tools not enabled
    for (const tx of transactions) {
      expect(tx.parseTrace).toBeUndefined();
    }
  });

  it("is populated when NEXT_PUBLIC_DEV_TOOLS is 'true'", () => {
    const originalVal = process.env.NEXT_PUBLIC_DEV_TOOLS;
    vi.stubEnv("NEXT_PUBLIC_DEV_TOOLS", "true");

    try {
      const devTransactions = dbsParser.parse(sampleCsv);
      for (const tx of devTransactions) {
        expect(tx.parseTrace).toBeDefined();
        expect(typeof tx.parseTrace!.cleanedPayee).toBe("string");
        expect(tx.parseTrace!.cleanedPayee.length).toBeGreaterThan(0);
      }
    } finally {
      if (originalVal === undefined) {
        vi.stubEnv("NEXT_PUBLIC_DEV_TOOLS", "");
      } else {
        vi.stubEnv("NEXT_PUBLIC_DEV_TOOLS", originalVal);
      }
    }
  });

  it("cleanedPayee matches description when stripPII changes nothing", () => {
    vi.stubEnv("NEXT_PUBLIC_DEV_TOOLS", "true");

    try {
      const devTransactions = dbsParser.parse(sampleCsv);
      // POS transactions have no card numbers — cleanedPayee should equal description
      const posTx = devTransactions.find((t) =>
        t.originalDescription.includes("NOODLE HOUSE STALL"),
      );
      expect(posTx).toBeDefined();
      expect(posTx!.parseTrace!.cleanedPayee).toBe(posTx!.description);
    } finally {
      vi.stubEnv("NEXT_PUBLIC_DEV_TOOLS", "");
    }
  });
});

// ---------------------------------------------------------------------------
// Format validation — rejection and catch-all
// ---------------------------------------------------------------------------

describe("format validation — cleaner rejection", () => {
  it("POS: returns Unknown Format when ref2 lacks TO: prefix", () => {
    const csv = buildCsv({
      code: "POS",
      ref1: "NETS QR PAYMENT ABC123",
      ref2: "SOME MERCHANT",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Unknown Format");
    expect(tx.notes).toBe("");
  });

  it("POS: returns Unknown Format when ref1 doesn't match NETS QR pattern", () => {
    const csv = buildCsv({
      code: "POS",
      ref1: "SOME OTHER PAYMENT",
      ref2: "TO: MERCHANT",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Unknown Format");
  });

  it("MST: returns Unknown Format when ref1 lacks acquirer suffix", () => {
    const csv = buildCsv({
      code: "MST",
      ref1: "JUST A MERCHANT NAME",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Unknown Format");
    expect(tx.notes).toBe("");
  });

  it("ICT: returns Unknown Format when PayNow outgoing ref3 lacks OTHR prefix", () => {
    const csv = buildCsv({
      code: "ICT",
      ref1: "PayNow Transfer REF123",
      ref2: "To: ALICE",
      ref3: "MISSING PREFIX NOTES",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Unknown Format");
  });

  it("ICT: returns Unknown Format when outgoing interbank ref3 has invalid purpose code structure", () => {
    const csv = buildCsv({
      code: "ICT",
      ref1: "Trus:0142345678:I-BANK",
      ref2: "Some notes",
      ref3: "TOOLONG 12345678",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Unknown Format");
    expect(tx.notes).toBe("");
  });

  it("ICT: returns Unknown Format for incoming external bank (no defined pattern)", () => {
    const csv = buildCsv({
      code: "ICT",
      ref1: "RANDOM ALPHANUMERIC STRING",
      ref2: "MORE RANDOM DATA",
      ref3: "YET MORE DATA",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Unknown Format");
    expect(tx.notes).toBe("");
  });

  it("ITR: returns Unknown Format when DBS outgoing ref3 lacks OTHR prefix", () => {
    const csv = buildCsv({
      code: "ITR",
      ref1: "DBS:I-BANK",
      ref2: "1234567890",
      ref3: "MISSING PREFIX NOTES 999",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Unknown Format");
  });

  it("ITR: returns Unknown Format for unrecognised sub-type", () => {
    const csv = buildCsv({
      code: "ITR",
      ref1: "UNKNOWN SUBTYPE",
      ref2: "SOMETHING",
      ref3: "SOMETHING ELSE",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Unknown Format");
    expect(tx.notes).toBe("");
  });
});

describe("format validation — happy-path via buildCsv", () => {
  it("ITR: PayLah! top-up returns payee PayLah! with notes Top-Up", () => {
    const csv = buildCsv({
      code: "ITR",
      ref1: "TOP UP TO PAYLAH! :",
      ref2: "91234567",
      ref3: "REF123",
      debit: "50.00",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("PayLah!");
    expect(tx.notes).toBe("Top-Up");
  });

  it("ITR: outgoing DBS transfer extracts notes from ref3", () => {
    const csv = buildCsv({
      code: "ITR",
      ref1: "DBS:I-BANK",
      ref2: "1234567890",
      ref3: "OTHR lunch money 99999",
      debit: "25.00",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Dbs");
    expect(tx.notes).toBe("lunch money");
  });

  it("ITR: incoming DBS transfer detected via ref2 :IB suffix", () => {
    const csv = buildCsv({
      code: "ITR",
      ref1: "SOME REF STRING",
      ref2: "0012345678:IB",
      ref3: "",
      credit: "100.00",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Dbs");
    expect(tx.notes).toBe("");
  });
});

describe("catch-all fallback", () => {
  it("unknown transaction code produces Unknown Format", () => {
    const csv = buildCsv({
      code: "XYZ",
      ref1: "SOME SENSITIVE",
      ref2: "REF DATA",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Unknown Format");
    expect(tx.notes).toBe("");
  });

  it("known code with bad format produces Unknown Format (no PII leakage)", () => {
    const csv = buildCsv({
      code: "POS",
      ref1: "MALFORMED REF1",
      ref2: "MALFORMED REF2",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Unknown Format");
    expect(tx.notes).toBe("");
  });

  it("catch-all does not leak any raw field data", () => {
    const csv = buildCsv({
      code: "ZZZ",
      ref1: "PHONE 91234567",
      ref2: "ACCT 001234567890",
      ref3: "SENSITIVE REF3",
    });
    const [tx] = dbsParser.parse(csv);
    expect(tx.description).not.toContain("91234567");
    expect(tx.description).not.toContain("001234567890");
    expect(tx.notes).toBe("");
  });
});

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

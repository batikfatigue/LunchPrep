import type { RawTransaction } from "@/lib/parsers/types";

const SAMPLE_ROWS = [
  {
    day: 2,
    payee: "FairPrice Finest",
    amount: -64.8,
    category: "Groceries",
    notes: "Weekly groceries",
  },
  {
    day: 3,
    payee: "Ya Kun Kaya Toast",
    amount: -6.3,
    category: "Dining",
    notes: "Breakfast and kopi",
  },
  {
    day: 4,
    payee: "SimplyGo",
    amount: -2.18,
    category: "Transport",
    notes: "Morning commute",
  },
  {
    day: 5,
    payee: "Monthly salary",
    amount: 4200,
    category: "Income",
    notes: "Sample income",
  },
  {
    day: 6,
    payee: "Grab",
    amount: -18.5,
    category: "Transport",
    notes: "Ride home",
  },
  {
    day: 7,
    payee: "Tiong Bahru Bakery",
    amount: -14.2,
    category: "Dining",
    notes: "Coffee with a friend",
  },
  {
    day: 8,
    payee: "SP Services",
    amount: -92.4,
    category: "Utilities",
    notes: "Electricity and water",
  },
  {
    day: 9,
    payee: "Unlabelled purchase",
    amount: -24,
    category: "",
    notes: "Try assigning a category",
  },
];

/** Fresh fictional data for exploring review and export without an AI request. */
export function createSampleStatement(): {
  transactions: RawTransaction[];
  categoryMap: Map<number, string>;
} {
  return {
    transactions: SAMPLE_ROWS.map((row) => ({
      date: new Date(2026, 7, row.day),
      description: row.payee,
      originalDescription: row.payee,
      amount: row.amount,
      transactionCode: row.amount > 0 ? "SAL" : "POS",
      notes: row.notes,
      originalPII: {},
    })),
    categoryMap: new Map(
      SAMPLE_ROWS.flatMap((row, index) =>
        row.category ? [[index, row.category] as const] : [],
      ),
    ),
  };
}

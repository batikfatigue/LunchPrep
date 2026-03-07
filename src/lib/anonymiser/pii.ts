/**
 * PII anonymiser for bank transaction descriptions.
 *
 * Masks personal names in person-to-person transfer transactions (ICT/ITR)
 * before data is sent to the AI categorisation API. Preserves merchant names
 * on card/NETS transactions (POS/MST/UMC) so the AI receives full context.
 *
 * The anonymisation is reversible: each transaction stores its mock→original
 * mapping in the `originalPII` field, enabling restoration after categorisation.
 *
 * @see specs/ai-categorisation.md for anonymisation strategy
 */

import type { RawTransaction } from "@/lib/parsers/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Full transactionCode descriptions that indicate person-to-person transfers.
 * These values come from dbs_codes.json via lookupTransactionCode() in dbs.ts.
 * CRITICAL: Use full descriptions, not short codes like "ICT"/"ITR".
 */
const TRANSFER_TRANSACTION_CODES = new Set<string>([
  "FAST or PayNow Payment / Receipt", // DBS code: ICT
  "Funds Transfer", // DBS code: ITR
]);

/**
 * Keywords that identify business/merchant entities.
 * If a payee description contains any of these (case-insensitive),
 * it is treated as a merchant, not a personal name, and skipped.
 */
const BUSINESS_KEYWORDS: string[] = [
  "PTE LTD",
  "PTE. LTD.",
  "SDN BHD",
  " LTD",
  " LLC",
  " INC",
  " CORP",
  "COMPANY",
  "ENTERPRISE",
  "ENTERPRISES",
  "SERVICES",
  "SOLUTIONS",
  "HOLDINGS",
  "GROUP",
  "CAFE",
  "COFFEE",
  "RESTAURANT",
  "BAKERY",
  "KITCHEN",
  "CLINIC",
  "HOSPITAL",
  "PHARMACY",
  "SCHOOL",
  "ACADEMY",
  "SHOP",
  "STORE",
  "MARKET",
];

/**
 * Pool of gender-neutral Singapore mock names used as placeholders.
 * Realistic names preserve the AI's ability to infer transfer context
 * (e.g., a human name implies a peer-to-peer payment → "Transfers" category).
 */
const MOCK_NAMES: string[] = [
  "Alex Tan",
  "Sam Lim",
  "Jordan Wong",
  "Casey Ng",
  "Morgan Lee",
  "Taylor Chen",
  "Riley Goh",
  "Jamie Ong",
  "Drew Koh",
  "Quinn Ho",
  "Avery Toh",
  "Blake Yeo",
  "Cameron Sim",
  "Dana Wee",
  "Elliot Chua",
];

/** localStorage key for the user-curated anonymisation whitelist. */
const WHITELIST_STORAGE_KEY = "lunchprep_pii_whitelist";

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

/**
 * Return true if the transactionCode indicates a person-to-person transfer.
 *
 * Only ICT ("FAST or PayNow Payment / Receipt") and ITR ("Funds Transfer")
 * are candidates for personal-name anonymisation. Card and NETS purchases
 * always carry merchant names and must bypass this step.
 *
 * @param transactionCode - Full transaction code description from RawTransaction.
 * @returns True if the transaction type may contain a personal name.
 */
export function isTransferTransaction(transactionCode: string): boolean {
  return TRANSFER_TRANSACTION_CODES.has(transactionCode);
}

/**
 * Return true if the payee description matches a known business entity pattern.
 *
 * Business entities (e.g., "Grab Pte Ltd", "7-Eleven Store") should not be
 * anonymised even when they appear in transfer transactions (e.g., PayNow to
 * a business).
 *
 * @param name - Payee description to test.
 * @returns True if the name matches a business keyword.
 */
export function isBusinessName(name: string): boolean {
  const upper = name.toUpperCase();
  return BUSINESS_KEYWORDS.some((kw) => upper.includes(kw));
}

// ---------------------------------------------------------------------------
// Whitelist
// ---------------------------------------------------------------------------

/**
 * Load the user-curated whitelist from localStorage.
 *
 * Names in this set are treated as merchants and bypass anonymisation even
 * when they appear in transfer transactions (e.g., a hawker named "NG SOO IM"
 * that the user flagged as a legitimate merchant).
 *
 * Returns an empty Set in non-browser environments (SSR, Vitest without mocks).
 *
 * @returns Set of uppercased names that must not be anonymised.
 */
export function loadWhitelist(): Set<string> {
  // Reason: localStorage is unavailable in SSR and bare Vitest unless mocked.
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(WHITELIST_STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
      return new Set((arr as string[]).map((n) => n.toUpperCase()));
    }
  } catch {
    // Ignore malformed JSON or storage access errors
  }
  return new Set();
}

/**
 * Add a name to the user-curated whitelist in localStorage.
 *
 * No-ops in non-browser environments.
 *
 * @param name - Name to whitelist (stored as-is; comparison is case-insensitive).
 */
export function addToWhitelist(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadWhitelist();
    const updated = [...existing, name.toUpperCase()];
    window.localStorage.setItem(WHITELIST_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Core anonymisation
// ---------------------------------------------------------------------------

/**
 * Anonymise personal names in transfer transactions.
 *
 * Algorithm:
 * 1. Gate: skip POS/MST/UMC transactions — only process ICT and ITR.
 * 2. Gate: skip if payee matches a business keyword or the user's whitelist.
 * 3. Collect unique personal names across all eligible transactions.
 * 4. Assign a deterministic mock name from MOCK_NAMES to each unique name
 *    (cycling through the pool if there are more than 15 unique names).
 * 5. Return new transaction objects with:
 *    - `description` replaced by the mock name
 *    - `originalPII` populated as `{ [mockName]: originalName }`
 *
 * Input transactions are never mutated — new objects are returned.
 *
 * @param transactions - Parsed RawTransaction array (not modified).
 * @param whitelist - Optional set of uppercased names to skip. Defaults to
 *   loading from localStorage via loadWhitelist().
 * @returns New array of RawTransaction with personal names masked.
 */
export function anonymise(
  transactions: RawTransaction[],
  whitelist?: Set<string>,
): RawTransaction[] {
  const wl = whitelist ?? loadWhitelist();

  // First pass: collect unique personal names and assign mock names.
  // Reason: Using a Map keyed by uppercase ensures the same original name
  // receives the same mock across multiple transactions.
  const nameToMock = new Map<string, string>();
  let mockIndex = 0;

  for (const tx of transactions) {
    if (!isTransferTransaction(tx.transactionCode)) continue;
    if (!tx.description || tx.description.trim() === "") continue;
    if (isBusinessName(tx.description)) continue;

    const upper = tx.description.toUpperCase();
    if (wl.has(upper)) continue;
    if (nameToMock.has(upper)) continue;

    // Reason: Modulo cycling ensures we never run out of mock names even when
    // the real-name pool exceeds MOCK_NAMES.length.
    nameToMock.set(upper, MOCK_NAMES[mockIndex % MOCK_NAMES.length]);
    mockIndex++;
  }

  // Second pass: apply the mapping to eligible transactions.
  return transactions.map((tx) => {
    if (!isTransferTransaction(tx.transactionCode)) return tx;
    if (!tx.description || tx.description.trim() === "") return tx;
    if (isBusinessName(tx.description)) return tx;

    const upper = tx.description.toUpperCase();
    const mockName = nameToMock.get(upper);
    if (!mockName) return tx; // whitelisted — no mapping assigned

    return {
      ...tx,
      description: mockName,
      // Reason: Spread-merge preserves any existing originalPII entries
      // (e.g., if anonymise() is called multiple times on the same batch).
      originalPII: { ...tx.originalPII, [mockName]: tx.description },
    };
  });
}

/**
 * Restore original PII names after AI categorisation is complete.
 *
 * For each transaction with a non-empty `originalPII` map, looks up the
 * current `description` (mock name) in the map and replaces it with the
 * stored original name. The restored names are used when generating the
 * final Lunch Money CSV export.
 *
 * Input transactions are never mutated — new objects are returned.
 *
 * @param transactions - Anonymised RawTransaction array (not modified).
 * @returns New array with original names restored.
 */
export function restore(transactions: RawTransaction[]): RawTransaction[] {
  return transactions.map((tx) => {
    if (Object.keys(tx.originalPII).length === 0) return tx;

    const original = tx.originalPII[tx.description];
    if (!original) return tx;

    return { ...tx, description: original };
  });
}

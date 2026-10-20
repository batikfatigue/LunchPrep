import type { CSSProperties } from "react";

/** Fictional statement lines: raw DBS-style text and the prepared row. */
const PAIRS = [
  {
    raw: ["23 Feb", "NETS QR PAYMENT 8841", "TO: NOODLE HOUSE STALL", "9.30 DR"],
    date: "2026-02-23",
    payee: "Noodle House Stall",
    amount: "-9.30",
    category: "Dining",
    notes: "",
  },
  {
    raw: ["21 Feb", "MST 4WWZ1 BURGER KING (XYZ) SI SGP 21FEB", "XXXX-XXXX-XXXX-0000", "28.45 DR"],
    date: "2026-02-21",
    payee: "Burger King",
    amount: "-28.45",
    category: "Dining",
    notes: "",
  },
  {
    raw: ["21 Feb", "Incoming PayNow Ref 7712 From: ALICE WONG", "OTHR PayNow transfer", "200.00 CR"],
    date: "2026-02-21",
    payee: "Alice Wong",
    amount: "200.00",
    category: "Income",
    notes: "PayNow transfer",
  },
];

/**
 * The product as a two-pane workbench: fictional raw bank lines (source) beside
 * the prepared Lunch Money rows (output), with a line-number gutter and a status
 * bar. The parts LunchPrep rewrote get a one-time marker wipe; hovering a row
 * lifts the source line and its output together. Presentational, no real data.
 *
 * @returns {JSX.Element} A figure that explains the transformation.
 */
export function PrepSheet() {
  return (
    <figure
      className="rise"
      style={{ "--i": 3 } as CSSProperties}
      aria-label="Example: three fictional bank lines turned into Lunch Money rows"
    >
      <div aria-hidden className="pane">
        <div className="grid border-b bg-muted md:grid-cols-[1.15fr_1fr]">
          <p className="pane-bar !border-b-0">
            <span className="size-1.5 rounded-full bg-muted-foreground/50" />
            <span>statement.csv</span>
            <span className="label ml-auto">source</span>
          </p>
          <p className="pane-bar hidden !border-b-0 md:flex md:border-l">
            <span className="size-1.5 rounded-full bg-ok" />
            <span>lunchmoney.csv</span>
            <span className="label ml-auto">output</span>
          </p>
        </div>
        <ul>
          {PAIRS.map((pair, i) => (
            <li
              key={pair.raw[1]}
              style={{ "--i": i } as CSSProperties}
              className="grid border-b transition-colors duration-200 last:border-b-0 hover:bg-muted/70 md:grid-cols-[1.15fr_1fr]"
            >
              <div className="flex gap-3 px-4 py-4 md:px-5 md:py-6">
                <span className="gutter pt-0.5">{i + 1}</span>
                <p className="tabular break-words text-[0.75rem] leading-5 text-muted-foreground">
                  <span className="mr-3">{pair.raw[0]}</span>
                  {pair.raw[1]} {pair.raw[2]}
                  <span className="ml-3 whitespace-nowrap">{pair.raw[3]}</span>
                </p>
              </div>
              <dl className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4 gap-y-1.5 border-t px-4 py-4 text-sm md:border-l md:border-t-0 md:px-6 md:py-6">
                <dt className="sr-only">Payee</dt>
                <dd className="col-span-2 text-base">
                  <span className="marker marker-wipe">{pair.payee}</span>
                </dd>
                <dt className="sr-only">Amount</dt>
                <dd className="tabular">
                  <span className="marker marker-wipe">{pair.amount}</span>
                </dd>
                <dt className="sr-only">Date</dt>
                <dd className="tabular text-xs text-muted-foreground">
                  {pair.date}
                </dd>
                <dt className="sr-only">Category</dt>
                <dd>
                  <span className="marker marker-wipe rounded-full px-2.5 text-xs">
                    {pair.category}
                  </span>
                </dd>
                <dd className="tabular truncate text-right text-xs text-muted-foreground">
                  {pair.notes}
                </dd>
              </dl>
            </li>
          ))}
        </ul>
        <p className="pane-status label">
          <span>sample data</span>
          <span>3 lines in, 3 rows out</span>
          <span>columns: date, payee, amount, category, notes</span>
        </p>
      </div>
      <figcaption className="label mt-3 flex justify-between gap-4">
        <span>Sample data, not a real account</span>
        <span>Highlighted = rewritten by LunchPrep</span>
      </figcaption>
    </figure>
  );
}

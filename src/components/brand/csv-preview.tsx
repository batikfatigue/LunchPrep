/** Header and fictional rows shown in the export preview. */
const COLUMNS = ["date", "payee", "amount", "category", "notes"];
const ROWS = [
  ["2026-02-23", "Noodle House Stall", "-9.30", "Dining", ""],
  ["2026-02-21", "Alice Wong", "200.00", "Income", "PayNow transfer"],
];

/**
 * A file-shaped preview of the CSV the download produces: filename tab, the
 * five columns Lunch Money's import reads, two fictional rows. Presentational.
 *
 * @returns {JSX.Element} Figure with the format preview.
 */
export function CsvPreview() {
  return (
    <figure className="mb-10 min-w-0">
      <div className="pane">
        <p className="pane-bar justify-between">
          <span className="flex min-w-0 items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-ok" />
            <span className="truncate">lunchprep-export-2026-02-23.csv</span>
          </span>
          <span className="label">.csv</span>
        </p>
        <div className="overflow-x-auto" role="img" aria-label="Preview of the exported CSV columns: date, payee, amount, category, notes, with two fictional rows">
          <table className="tabular w-full text-left text-xs" aria-hidden>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c} className="px-3 py-3 font-medium">
                    <span className="marker">{c}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row[0] + row[1]} className="border-t">
                  {row.map((cell, i) => (
                    <td key={i} className="px-3 py-3 align-top text-muted-foreground">
                      {cell || "–"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pane-status label">
          <span>sample data</span>
          <span>2 rows</span>
          <span>5 columns</span>
        </p>
      </div>
      <figcaption className="label mt-3 flex justify-between gap-4">
        <span>Format preview, sample data</span>
        <span>Lunch Money CSV</span>
      </figcaption>
    </figure>
  );
}

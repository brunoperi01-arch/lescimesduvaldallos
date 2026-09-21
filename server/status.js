// Rapport d'état des migrations (lecture seule, pur -> testable).
export function statusReport(files, appliedRows) {
  const applied = new Map(appliedRows.map((r) => [r.filename, r.checksum]));
  const present = new Set(files.map((f) => f.filename));
  const out = files.map((f) => {
    const rec = applied.get(f.filename);
    const state = !rec ? "pending" : rec === f.checksum ? "applied" : "divergent";
    return { filename: f.filename, state, local: f.checksum, recorded: rec || null };
  });
  for (const [filename, checksum] of applied) {
    if (!present.has(filename)) out.push({ filename, state: "missing_file", local: null, recorded: checksum });
  }
  return out.sort((a, b) => a.filename.localeCompare(b.filename));
}
// Code de sortie : non nul si divergence ou fichier appliqué absent localement.
export function statusExitCode(report) {
  return report.some((r) => r.state === "divergent" || r.state === "missing_file") ? 1 : 0;
}

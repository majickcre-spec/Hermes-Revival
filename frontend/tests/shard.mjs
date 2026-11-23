// One pre-flight shard: runs its share (SHARD="i/n") of every suite. Exit 1 if anything failed.
let ok = true;
for (const f of ["./smoke.mjs", "./data-safety.mjs", "./sync-safety.mjs", "./backup-safety.mjs"]) {
  const m = await import(f); if (!(await m.run())) ok = false;
}
process.exit(ok ? 0 : 1);

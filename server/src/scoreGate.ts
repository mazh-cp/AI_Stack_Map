// CI score gate — computes a project's AI Security Score from the database and
// exits non-zero if it is below the required threshold. Intended to run in CI
// after the DB is set up and seeded.
//
//   SCORE_MIN=60 SCORE_PROJECT=proj-copilot npm run score:gate
//   npm run score:gate -- --min 60 --project proj-copilot

import { prisma } from "./db.js";
import { scoreProject } from "./score.js";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const min = Number(arg("--min") ?? process.env.SCORE_MIN ?? 60);
  const projectId = arg("--project") ?? process.env.SCORE_PROJECT ?? "proj-copilot";

  const breakdown = await scoreProject(prisma, projectId);
  const pass = breakdown.score >= min;

  console.log(`\nAI Security Score Gate`);
  console.log(`  Project   : ${projectId}`);
  console.log(`  Score     : ${breakdown.score}/100 (Grade ${breakdown.grade})`);
  console.log(`  Threshold : ${min}`);
  console.log(`  Coverage  : ${breakdown.coverage}%  ·  open risks: ${breakdown.openRisks}  ·  critical gaps: ${breakdown.criticalGaps}`);
  if (breakdown.penalties.length) {
    console.log(`  Penalties :`);
    for (const p of breakdown.penalties) console.log(`    - ${p.label} (-${p.points})`);
  }
  console.log(`\n  ${pass ? "PASS ✅" : "FAIL ❌"} — score ${breakdown.score} ${pass ? ">=" : "<"} ${min}\n`);

  await prisma.$disconnect();
  process.exit(pass ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(2);
});

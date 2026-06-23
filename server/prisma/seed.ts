// Seeds the SQLite database with the demo dataset. Idempotent: clears tables
// first so re-running produces a clean, known state.

import { prisma } from "../src/db.js";
import { stringifyJsonFields } from "../src/serialize.js";
import { hashPassword } from "../src/auth.js";
import {
  users,
  DEMO_PASSWORD,
  projects,
  controls,
  risks,
  incidents,
  compliance,
  evidence,
  integrations,
  models,
  fileScans,
  promptInspections,
} from "../src/seedData.js";

const enc = (path: string, rows: Record<string, unknown>[]) =>
  rows.map((r) => stringifyJsonFields(path, r));

async function main() {
  // Never auto-create demo accounts in production unless explicitly allowed.
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    console.error(
      "Refusing to seed demo data in production. Set ALLOW_SEED=true to override."
    );
    process.exit(1);
  }
  console.log("Seeding database…");

  // Clear existing rows (order does not matter — no FK constraints).
  await prisma.$transaction([
    prisma.user.deleteMany(),
    prisma.securityControl.deleteMany(),
    prisma.risk.deleteMany(),
    prisma.incident.deleteMany(),
    prisma.complianceMapping.deleteMany(),
    prisma.evidence.deleteMany(),
    prisma.integration.deleteMany(),
    prisma.modelCoverage.deleteMany(),
    prisma.fileScan.deleteMany(),
    prisma.promptInspection.deleteMany(),
    prisma.project.deleteMany(),
  ]);

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const createdAt = "2026-06-22";
  await prisma.user.createMany({
    data: users.map((u) => ({ ...u, passwordHash, createdAt })),
  });

  await prisma.project.createMany({ data: projects });
  await prisma.securityControl.createMany({ data: enc("controls", controls) as never });
  await prisma.risk.createMany({ data: enc("risks", risks) as never });
  await prisma.incident.createMany({ data: incidents });
  await prisma.complianceMapping.createMany({ data: compliance });
  await prisma.evidence.createMany({ data: evidence });
  await prisma.integration.createMany({ data: enc("integrations", integrations) as never });
  await prisma.modelCoverage.createMany({ data: enc("models", models) as never });
  await prisma.fileScan.createMany({ data: enc("fileScans", fileScans) as never });
  await prisma.promptInspection.createMany({
    data: enc("promptInspections", promptInspections) as never,
  });

  console.log(
    `Seeded: ${users.length} users, ${projects.length} projects, ${controls.length} controls, ${risks.length} risks, ${models.length} models, ${fileScans.length} file scans.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

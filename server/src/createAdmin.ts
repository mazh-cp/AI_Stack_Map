// First-admin bootstrap. Use this in production (where demo seeding is blocked)
// to create the initial Owner account, or to reset an owner's password.
//
//   npm run create:admin -- --email you@org.com --name "You" --password 'StrongPass!23'
//   ADMIN_EMAIL=you@org.com ADMIN_PASSWORD='StrongPass!23' npm run create:admin

import "dotenv/config";
import { prisma } from "./db.js";
import { hashPassword } from "./auth.js";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = (arg("--email") || process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const name = arg("--name") || process.env.ADMIN_NAME || "Administrator";
  const password = arg("--password") || process.env.ADMIN_PASSWORD || "";

  if (!email || !password) {
    console.error(
      "Usage: npm run create:admin -- --email <email> --name <name> --password <password>"
    );
    console.error("(or set ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD)");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash, role: "owner", name },
    });
    console.log(`Updated ${email} → owner (password reset).`);
  } else {
    await prisma.user.create({
      data: {
        id: `usr-${Date.now()}`,
        email,
        name,
        role: "owner",
        passwordHash,
        createdAt: new Date().toISOString().slice(0, 10),
      },
    });
    console.log(`Created owner ${email}.`);
  }
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

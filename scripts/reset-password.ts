/**
 * One-time script to reset a user's password.
 * Run: npx ts-node scripts/reset-password.ts YOUR_EMAIL NEW_PASSWORD
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("Usage: npx ts-node scripts/reset-password.ts <email> <new-password>");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log(`Password updated for ${email}. You can now log in with your new password.`);
  await prisma.$disconnect();
}

main();

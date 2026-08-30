import { PrismaClient, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
  const name = process.env.ADMIN_NAME || "ARGYR Admin";
  const email = process.env.ADMIN_EMAIL || "admin@argyr.com";
  const password = process.env.ADMIN_PASSWORD || "ArgyrSecure2026!";

  console.log("Checking for existing administrators...");
  const existingAdmin = await prisma.adminUser.findFirst({
    where: { email }
  });

  if (existingAdmin) {
    console.log(`Admin user with email ${email} already exists!`);
    return;
  }

  console.log(`Creating admin user: ${name} (${email})...`);
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.create({
    data: {
      name,
      email,
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      active: true
    }
  });

  console.log(`\n🎉 Admin user created successfully!`);
  console.log(`Email: ${admin.email}`);
  console.log(`Password: ${password}`);
  console.log(`Role: ${admin.role}\n`);
}

main()
  .catch((e) => {
    console.error("Error creating admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const users = ['postgres', 'DELL'];
const passwords = [
  '',
  'postgres',
  'admin',
  'root',
  'password',
  '1234',
  '123456',
  '12345',
  'root123',
  'admin123',
  'pgadmin'
];

async function main() {
  console.log("Starting DB credential discovery...");
  for (const user of users) {
    for (const password of passwords) {
      // Connect to default 'postgres' database to check credentials
      const url = `postgresql://${user}:${password}@localhost:5432/postgres?schema=public`;
      const prisma = new PrismaClient({
        datasources: {
          db: { url }
        }
      });
      try {
        console.log(`Trying ${user} with password "${password}"...`);
        // Force connection
        await prisma.$queryRaw`SELECT 1`;
        console.log(`\n🎉 SUCCESS! Connected using: ${url}\n`);
        await prisma.$disconnect();
        return;
      } catch (err: any) {
        await prisma.$disconnect();
      }
    }
  }
  console.log("❌ All credential attempts failed.");
}

main().catch(console.error);

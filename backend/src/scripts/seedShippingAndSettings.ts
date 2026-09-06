import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding default shipping methods and store settings...");

  // Default shipping methods
  const defaultShipping = [
    {
      name: "Lagos Island",
      code: "lagos_island",
      description: "Express doorstep delivery across Lagos Island, Ikoyi, Victoria Island & Lekki Phase 1",
      price: 5000.00,
      currency: "NGN",
      active: true,
      sortOrder: 1
    },
    {
      name: "Lagos Mainland",
      code: "lagos_mainland",
      description: "Standard doorstep delivery across Lagos Mainland, Ikeja, Surulere, Yaba & Environs",
      price: 6000.00,
      currency: "NGN",
      active: true,
      sortOrder: 2
    },
    {
      name: "Nigeria — Outside Lagos",
      code: "nigeria_outside_lagos",
      description: "Interstate insured courier delivery across all states in Nigeria",
      price: 10000.00,
      currency: "NGN",
      active: true,
      sortOrder: 3
    },
    {
      name: "International",
      code: "international",
      description: "DHL / FedEx priority international shipping with global tracking to supported countries",
      price: 120000.00,
      currency: "NGN",
      active: true,
      sortOrder: 4
    }
  ];

  for (const method of defaultShipping) {
    await prisma.shippingMethod.upsert({
      where: { code: method.code },
      update: {},
      create: method
    });
  }
  console.log("✅ Seeded default shipping methods.");

  // Default settings
  const defaultSettings = [
    { key: "ESTIMATED_DELIVERY_TIMEFRAME", value: "7–14 days" },
    { key: "SUPPORT_EMAIL", value: "support@argyrworldwide.com" },
    { key: "BUSINESS_NAME", value: "ARGYR Footwear" }
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    });
  }
  console.log("✅ Seeded default operational settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, Gender, ProductStatus } from '@prisma/client';
import { isCloudinaryConfigured, uploadUrlToCloudinary } from '../src/utils/cloudinaryHelper';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // Clear existing data (in order of relations)
  await prisma.setting.deleteMany({});
  await prisma.customRequestImage.deleteMany({});
  await prisma.customRequest.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.adminUser.deleteMany({});

  // 1. Seed default system settings
  await prisma.setting.createMany({
    data: [
      { key: "WHATSAPP_BUSINESS_NUMBER", value: "2348000000000" },
      { key: "STORE_EMAIL", value: "orders@argyr.com" },
      { key: "STORE_NAME", value: "ARGYR" },
      { key: "DEFAULT_CURRENCY", value: "NGN" },
      { key: "DEFAULT_COUNTRY", value: "Nigeria" }
    ]
  });
  console.log("Seeded system settings.");

  // 2. Seed Categories
  const categories = [
    { name: "Sneakers", slug: "sneakers", description: "Premium athletic lifestyle footwear", sortOrder: 0 },
    { name: "Formal", slug: "formal", description: "Goodyear-welted oxfords, derbies and monk straps", sortOrder: 1 },
    { name: "Casual", slug: "casual", description: "Suede drivers, loafers, and slip-on luxury", sortOrder: 2 },
    { name: "Boots", slug: "boots", description: "Rugged yet refined high-top footwear", sortOrder: 3 },
    { name: "Sandals", slug: "sandals", description: "Elevated slides and open-toe footwear", sortOrder: 4 },
    { name: "Kids", slug: "kids", description: "Handcrafted comfort for children", sortOrder: 5 }
  ];

  const dbCategories: any[] = [];
  for (const cat of categories) {
    const dbCat = await prisma.category.create({
      data: cat
    });
    dbCategories.push(dbCat);
  }
  console.log(`Seeded ${dbCategories.length} categories.`);

  // Helpers to get category IDs
  const getCatId = (slug: string) => dbCategories.find(c => c.slug === slug)?.id || "";

  // 3. Seed Products
  const productsData = [
    {
      name: "ARGYR Noir Runner",
      slug: "argyr-noir-runner",
      description: "A high-performance luxury sneaker crafted from premium full-grain Italian leather and breathable knit mesh. Features a custom lightweight athletic sole, reinforced heel counters, and subtle debossed branding. Designed to offer effortless support and exceptional breathability for dynamic daily wear.",
      shortDescription: "High-performance luxury leather sneaker with knit mesh detailing.",
      price: 85000.00,
      bulkPrice: 75000.00,
      bulkMinimumQuantity: 10,
      stockQuantity: 25,
      sku: "ARG-SNE-001",
      categoryId: getCatId("sneakers"),
      gender: Gender.UNISEX,
      material: "Full-grain Italian Leather & Knit Mesh",
      collection: "Urban Series",
      featured: true,
      newArrival: true,
      bestSeller: false,
      status: ProductStatus.ACTIVE,
      sizes: ["40", "41", "42", "43", "44", "45"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
          altText: "ARGYR Noir Runner side view",
          sortOrder: 0
        },
        {
          url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80",
          altText: "ARGYR Noir Runner premium leather detailing",
          sortOrder: 1
        }
      ]
    },
    {
      name: "ARGYR Atelier Oxford",
      slug: "argyr-atelier-oxford",
      description: "The pinnacle of dress footwear. Handcrafted using traditional Goodyear welt construction, select box calf leather, and a finely finished, hand-stained leather sole. Fully lined in soft calfskin, this classic oxford delivers refined proportions and enduring comfort for formal affairs.",
      shortDescription: "Classic Goodyear-welted formal shoe in black box calf leather.",
      price: 120000.00,
      bulkPrice: 105000.00,
      bulkMinimumQuantity: 5,
      stockQuantity: 15,
      sku: "ARG-FOR-002",
      categoryId: getCatId("formal"),
      gender: Gender.MEN,
      material: "Premium Box Calf Leather",
      collection: "Atelier Classics",
      featured: true,
      newArrival: false,
      bestSeller: true,
      status: ProductStatus.ACTIVE,
      sizes: ["41", "42", "43", "44", "45"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80",
          altText: "ARGYR Atelier Oxford formal profile",
          sortOrder: 0
        }
      ]
    },
    {
      name: "ARGYR Regent Loafer",
      slug: "argyr-regent-loafer",
      description: "Slip-on luxury for everyday elegance. Crafted from buttery-soft English suede with a hand-stitched apron and a flexible rubber-studded driver sole. Unlined quarters provide a relaxed, glove-like fit that molds to your foot over time.",
      shortDescription: "Elegant suede slip-on loafer with hand-stitched detailing.",
      price: 95000.00,
      bulkPrice: 85000.00,
      bulkMinimumQuantity: 10,
      stockQuantity: 20,
      sku: "ARG-CAS-003",
      categoryId: getCatId("casual"),
      gender: Gender.MEN,
      material: "Premium Suede",
      collection: "Regency Casuals",
      featured: false,
      newArrival: true,
      bestSeller: false,
      status: ProductStatus.ACTIVE,
      sizes: ["40", "41", "42", "43", "44"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
          altText: "ARGYR Regent Loafer tan suede view",
          sortOrder: 0
        }
      ]
    },
    {
      name: "ARGYR Heritage Boot",
      slug: "argyr-heritage-boot",
      description: "Rugged durability meets refined city style. Built with thick, water-resistant pull-up leather that develops a beautiful individual patina with wear. Featuring heavy-duty speed hooks, a padded collar, and a rugged Vibram commando sole for slip resistance.",
      shortDescription: "Water-resistant pull-up leather boot with Vibram lug sole.",
      price: 140000.00,
      bulkPrice: 125000.00,
      bulkMinimumQuantity: 5,
      stockQuantity: 12,
      sku: "ARG-BOO-004",
      categoryId: getCatId("boots"),
      gender: Gender.UNISEX,
      material: "Water-resistant Pull-up Leather",
      collection: "Heritage Workwear",
      featured: true,
      newArrival: false,
      bestSeller: false,
      status: ProductStatus.ACTIVE,
      sizes: ["41", "42", "43", "44", "45", "46"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80",
          altText: "ARGYR Heritage Boot angled view",
          sortOrder: 0
        }
      ]
    },
    {
      name: "ARGYR Atelier Slide",
      slug: "argyr-atelier-slide",
      description: "Elevated leisurewear for warm climates. Constructed with wide cross-over straps in premium textured pebbled calfskin. Features a contoured cork and latex footbed wrapped in smooth suede, and a durable EVA outsole.",
      shortDescription: "Luxury cross-strap slide with contoured cork footbed.",
      price: 50000.00,
      bulkPrice: 42000.00,
      bulkMinimumQuantity: 15,
      stockQuantity: 30,
      sku: "ARG-SAN-005",
      categoryId: getCatId("sandals"),
      gender: Gender.UNISEX,
      material: "Pebbled Calf Leather & Cork",
      collection: "Summer Atelier",
      featured: false,
      newArrival: false,
      bestSeller: true,
      status: ProductStatus.ACTIVE,
      sizes: ["37", "38", "39", "40", "41", "42", "43", "44", "45"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
          altText: "ARGYR Atelier Slide top profile",
          sortOrder: 0
        }
      ]
    },
    {
      name: "ARGYR Petite Trainer",
      slug: "argyr-petite-trainer",
      description: "Premium handcrafted comfort for active children. Built with flexible, soft calfskin and dual adjustable hook-and-loop straps for a secure fit. Fully padded tongue, cushioned ankle collar, and a protective rubber cupsole.",
      shortDescription: "Handcrafted leather child trainer with hook-and-loop closures.",
      price: 45000.00,
      bulkPrice: 38000.00,
      bulkMinimumQuantity: 10,
      stockQuantity: 18,
      sku: "ARG-KID-006",
      categoryId: getCatId("kids"),
      gender: Gender.KIDS,
      material: "Full Calfskin Leather",
      collection: "Petite Series",
      featured: false,
      newArrival: true,
      bestSeller: false,
      status: ProductStatus.ACTIVE,
      sizes: ["30", "31", "32", "33", "34", "35"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80",
          altText: "ARGYR Petite Trainer trainer view",
          sortOrder: 0
        }
      ]
    }
  ];

  const cloudinaryConfigured = isCloudinaryConfigured();
  if (cloudinaryConfigured) {
    console.log("Cloudinary credentials detected. Uploading seed images to Cloudinary...");
  } else {
    console.log("Cloudinary is not configured. Seeding default unsplash URLs.");
  }

  for (const prod of productsData) {
    const { images, ...productFields } = prod;
    
    const processedImages = [];
    for (const img of images) {
      let finalUrl = img.url;
      let publicId = null;
      if (cloudinaryConfigured) {
        try {
          console.log(`Uploading: ${img.altText} to Cloudinary...`);
          const cloudResult = await uploadUrlToCloudinary(img.url);
          finalUrl = cloudResult.url;
          publicId = cloudResult.publicId;
        } catch (err) {
          console.error(`Failed to upload ${img.url} to Cloudinary, falling back:`, err);
        }
      }
      processedImages.push({
        url: finalUrl,
        altText: img.altText,
        sortOrder: img.sortOrder,
        publicId
      });
    }

    const dbProduct = await prisma.product.create({
      data: {
        ...productFields,
        images: {
          create: processedImages
        }
      }
    });
    console.log(`Seeded product: ${dbProduct.name}`);
  }

  console.log("Seeding complete successfully! 🌱");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

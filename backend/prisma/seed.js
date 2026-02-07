import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 创建管理员
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@artring.com' },
    update: {},
    create: {
      email: 'admin@artring.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      emailVerified: true
    }
  });
  console.log('✅ Admin user created:', admin.email);

  // 创建分类
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'minimal' },
      update: {},
      create: {
        name: '简约系列',
        slug: 'minimal',
        description: '简约而不简单，展现优雅气质',
        sortOrder: 1
      }
    }),
    prisma.category.upsert({
      where: { slug: 'vintage' },
      update: {},
      create: {
        name: '复古系列',
        slug: 'vintage',
        description: '经典复古风格，永不过时',
        sortOrder: 2
      }
    }),
    prisma.category.upsert({
      where: { slug: 'artistic' },
      update: {},
      create: {
        name: '艺术系列',
        slug: 'artistic',
        description: '独特艺术设计，彰显个性',
        sortOrder: 3
      }
    }),
    prisma.category.upsert({
      where: { slug: 'bohemian' },
      update: {},
      create: {
        name: '波西米亚系列',
        slug: 'bohemian',
        description: '自由浪漫，随性自然',
        sortOrder: 4
      }
    })
  ]);
  console.log('✅ Categories created:', categories.length);

  // 创建商品
  const products = [
    {
      name: '极简金圈戒指',
      slug: 'minimal-gold-ring',
      description: '这款极简金圈戒指采用18K金打造，简约大方，适合日常佩戴。细腻的抛光表面在光线下闪烁着温暖的光芒。',
      shortDesc: '18K金简约戒指，日常百搭',
      material: '18K金',
      style: '极简',
      basePrice: 89.00,
      comparePrice: 119.00,
      categoryId: categories[0].id,
      isFeatured: true,
      variants: [
        { sku: 'MG-5-G', size: '5', color: '金色', price: 89.00, stock: 10 },
        { sku: 'MG-6-G', size: '6', color: '金色', price: 89.00, stock: 15 },
        { sku: 'MG-7-G', size: '7', color: '金色', price: 89.00, stock: 20 },
        { sku: 'MG-8-G', size: '8', color: '金色', price: 89.00, stock: 12 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=800', isPrimary: false }
      ]
    },
    {
      name: '925银双层缠绕戒指',
      slug: 'silver-twist-ring',
      description: '精致的双层缠绕设计，925纯银材质，低调奢华。独特的扭转造型为简约风格增添一丝灵动。',
      shortDesc: '925银双层设计，优雅灵动',
      material: '925银',
      style: '极简',
      basePrice: 59.00,
      categoryId: categories[0].id,
      isFeatured: true,
      variants: [
        { sku: 'ST-5-S', size: '5', color: '银色', price: 59.00, stock: 20 },
        { sku: 'ST-6-S', size: '6', color: '银色', price: 59.00, stock: 25 },
        { sku: 'ST-7-S', size: '7', color: '银色', price: 59.00, stock: 30 },
        { sku: 'ST-8-S', size: '8', color: '银色', price: 59.00, stock: 18 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800', isPrimary: true }
      ]
    },
    {
      name: '复古雕花戒指',
      slug: 'vintage-carved-ring',
      description: '灵感来自维多利亚时代的精美雕花，每一个细节都经过精心雕琢。这款戒指将古典美学与现代工艺完美结合。',
      shortDesc: '维多利亚风格雕花设计',
      material: '925银',
      style: '复古',
      basePrice: 79.00,
      categoryId: categories[1].id,
      variants: [
        { sku: 'VC-6-S', size: '6', color: '银色', price: 79.00, stock: 15 },
        { sku: 'VC-7-S', size: '7', color: '银色', price: 79.00, stock: 20 },
        { sku: 'VC-6-G', size: '6', color: '金色', price: 99.00, stock: 10 },
        { sku: 'VC-7-G', size: '7', color: '金色', price: 99.00, stock: 12 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800', isPrimary: true }
      ]
    },
    {
      name: '几何艺术戒指',
      slug: 'geometric-art-ring',
      description: '大胆的几何设计，打破传统戒指的圆润形态。这款戒指是现代艺术与珠宝工艺的完美融合，适合追求个性的你。',
      shortDesc: '现代几何设计，个性张扬',
      material: '不锈钢',
      style: '艺术',
      basePrice: 69.00,
      categoryId: categories[2].id,
      isFeatured: true,
      variants: [
        { sku: 'GA-6-B', size: '6', color: '黑色', price: 69.00, stock: 18 },
        { sku: 'GA-7-B', size: '7', color: '黑色', price: 69.00, stock: 22 },
        { sku: 'GA-8-B', size: '8', color: '黑色', price: 69.00, stock: 15 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', isPrimary: true }
      ]
    },
    {
      name: '波西米亚绿松石戒指',
      slug: 'bohemian-turquoise-ring',
      description: '天然绿松石镶嵌于精致银框中，展现自然之美。这款戒指散发着自由浪漫的波西米亚气息。',
      shortDesc: '天然绿松石，自然之美',
      material: '925银',
      style: '波西米亚',
      basePrice: 99.00,
      categoryId: categories[3].id,
      variants: [
        { sku: 'BT-6-S', size: '6', color: '银色', price: 99.00, stock: 8 },
        { sku: 'BT-7-S', size: '7', color: '银色', price: 99.00, stock: 10 },
        { sku: 'BT-8-S', size: '8', color: '银色', price: 99.00, stock: 6 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800', isPrimary: true }
      ]
    },
    {
      name: '玫瑰金心形戒指',
      slug: 'rose-gold-heart-ring',
      description: '浪漫的心形设计，玫瑰金色调温柔动人。这款戒指是表达爱意的完美选择，也是自我宠爱的最佳礼物。',
      shortDesc: '玫瑰金心形设计，浪漫动人',
      material: '18K玫瑰金',
      style: '浪漫',
      basePrice: 119.00,
      comparePrice: 149.00,
      categoryId: categories[0].id,
      isFeatured: true,
      variants: [
        { sku: 'RH-5-RG', size: '5', color: '玫瑰金', price: 119.00, stock: 12 },
        { sku: 'RH-6-RG', size: '6', color: '玫瑰金', price: 119.00, stock: 15 },
        { sku: 'RH-7-RG', size: '7', color: '玫瑰金', price: 119.00, stock: 18 }
      ],
      images: [
        { url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800', isPrimary: true }
      ]
    }
  ];

  for (const productData of products) {
    const { variants, images, ...data } = productData;
    
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...data,
        variants: {
          create: variants
        },
        images: {
          create: images.map((img, i) => ({ ...img, sortOrder: i }))
        }
      }
    });
    console.log('✅ Product created:', product.name);
  }

  // 创建优惠券
  await prisma.coupon.upsert({
    where: { code: 'WELCOME15' },
    update: {},
    create: {
      code: 'WELCOME15',
      type: 'PERCENTAGE',
      value: 15,
      minPurchase: 50,
      startDate: new Date(),
      endDate: new Date('2025-12-31'),
      usageLimit: 1000
    }
  });
  console.log('✅ Coupon created: WELCOME15');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

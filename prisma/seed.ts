import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/server/utils/password';

const permissionsList = [
  'dashboard.view',
  'projects.view',
  'projects.create',
  'projects.update',
  'projects.delete',
  'clients.view',
  'clients.create',
  'clients.update',
  'clients.delete',
  'messages.view',
  'messages.reply',
  'messages.delete',
  'services.view',
  'services.create',
  'services.update',
  'services.delete',
  'pricing.view',
  'pricing.create',
  'pricing.update',
  'pricing.delete',
  'media.view',
  'media.upload',
  'media.delete',
  'settings.view',
  'settings.update',
  'contracts.view',
  'contracts.create',
  'contracts.update',
  'contracts.delete',
  'users.view',
  'users.create',
  'users.update',
  'users.delete',
];

async function main() {
  console.log('🌱 Seeding database roles, permissions, and admin user...');

  // 1. Upsert Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Administrator with full system access',
    },
  });

  const clientRole = await prisma.role.upsert({
    where: { name: 'Client' },
    update: {},
    create: {
      name: 'Client',
      description: 'Client user with restricted access',
    },
  });

  console.log(`✅ Roles created/verified: Admin (${adminRole.id}), Client (${clientRole.id})`);

  // 2. Upsert Permissions
  const createdPermissions = [];
  for (const permName of permissionsList) {
    const perm = await prisma.permission.upsert({
      where: { name: permName },
      update: {},
      create: {
        name: permName,
        description: `Permission to ${permName}`,
      },
    });
    createdPermissions.push(perm);
  }

  console.log(`✅ Total permissions created/verified: ${createdPermissions.length}`);

  // 3. Assign ALL permissions to Admin role
  for (const perm of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  console.log(`✅ Assigned all ${createdPermissions.length} permissions to Admin role.`);

  // 4. Create default Admin user if not exists
  const adminEmail = 'admin@yugenforge.com';
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const hashedPassword = await hashPassword('Admin@123456');
    adminUser = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        status: 'ACTIVE',
        roleId: adminRole.id,
      },
    });
    console.log(`✅ Default Admin user created: ${adminEmail}`);
  } else {
    console.log(`✅ Default Admin user already exists: ${adminEmail}`);
  }

  // 5. Seed Hero Section if not exists
  const existingHero = await prisma.heroSection.findFirst();
  if (!existingHero) {
    await prisma.heroSection.create({
      data: {
        title: 'نبني المستقبل الرقمي بابتكار لا محدود',
        titleAr: 'نبني المستقبل الرقمي بابتكار لا محدود',
        titleEn: 'Building the Digital Future with Unlimited Innovation',
        subtitle: 'نحول أفكارك المعقدة إلى منتجات رقمية استثنائية، منصات SaaS، وحلول ذكاء اصطناعي متطورة.',
        subtitleAr: 'نحول أفكارك المعقدة إلى منتجات رقمية استثنائية، منصات SaaS، وحلول ذكاء اصطناعي متطورة.',
        subtitleEn: 'We transform your complex ideas into extraordinary digital products, SaaS platforms, and advanced AI solutions.',
        buttonText: 'ابدأ مشروعك',
        buttonTextAr: 'ابدأ مشروعك',
        buttonTextEn: 'Start Your Project',
        buttonLink: '#contact',
        active: true,
      },
    });
    console.log('✅ Default Hero section created.');
  }

  // 6. Seed Services if none exist
  const servicesCount = await prisma.service.count();
  if (servicesCount === 0) {
    await prisma.service.createMany({
      data: [
        { title: 'تطوير مواقع الويب', titleAr: 'تطوير مواقع الويب', titleEn: 'Web Development', description: 'مواقع سريعة، عصرية، ومبنية بأحدث التقنيات.', descriptionAr: 'مواقع سريعة، عصرية، ومبنية بأحدث التقنيات.', descriptionEn: 'Fast, modern websites built with cutting-edge technologies.', icon: 'code', color: '#7C3AED', featured: true, displayOrder: 1 },
        { title: 'تطبيقات الويب و SaaS', titleAr: 'تطبيقات الويب و SaaS', titleEn: 'Web Apps & SaaS', description: 'تطبيقات ويب تفاعلية بأداء عالٍ وتجربة سلسة.', descriptionAr: 'تطبيقات ويب تفاعلية بأداء عالٍ وتجربة سلسة.', descriptionEn: 'Interactive web apps with high performance and smooth experience.', icon: 'app', color: '#A855F7', featured: true, displayOrder: 2 },
        { title: 'حلول الذكاء الاصطناعي', titleAr: 'حلول الذكاء الاصطناعي', titleEn: 'AI Solutions', description: 'دمج الذكاء الاصطناعي في منتجاتك لتحقيق تفوق حقيقي.', descriptionAr: 'دمج الذكاء الاصطناعي في منتجاتك لتحقيق تفوق حقيقي.', descriptionEn: 'Integrating AI into your products for true competitive advantage.', icon: 'ai', color: '#C084FC', featured: true, displayOrder: 3 },
        { title: 'تصميم UI/UX', titleAr: 'تصميم UI/UX', titleEn: 'UI/UX Design', description: 'تجارب استخدام مدروسة تضع المستخدم أولاً.', descriptionAr: 'تجارب استخدام مدروسة تضع المستخدم أولاً.', descriptionEn: 'Thoughtful user experiences that put the user first.', icon: 'design', color: '#9333EA', featured: false, displayOrder: 4 },
        { title: 'الهوية البصرية', titleAr: 'الهوية البصرية', titleEn: 'Branding', description: 'هوية متكاملة تعكس شخصية علامتك التجارية.', descriptionAr: 'هوية متكاملة تعكس شخصية علامتك التجارية.', descriptionEn: 'Integrated brand identity reflecting your brand personality.', icon: 'brand', color: '#7C3AED', featured: false, displayOrder: 5 },
      ],
    });
    console.log('✅ Default services seeded.');
  }

  // 6b. Seed Pricing Plans if none exist (migrates the plans that used to be hardcoded in the frontend)
  const pricingCount = await prisma.pricingPlan.count();
  if (pricingCount === 0) {
    await prisma.pricingPlan.createMany({
      data: [
        {
          tierAr: 'انطلاقة',
          tierEn: 'Launch',
          price: '12,000',
          isCustom: false,
          descAr: 'مثالية للمشاريع الناشئة والهويات الأولى.',
          descEn: 'Perfect for startups and early-stage brands.',
          featuresAr: ['موقع تعريفي احترافي ومتجاوب', 'تصميم UI/UX مخصص على Figma', 'تحسين محركات البحث الأساسي SEO', 'تسليم خلال 3 أسابيع'],
          featuresEn: ['Professional, responsive landing website', 'Custom UI/UX design in Figma', 'Basic SEO optimization', '3-week delivery'],
          featured: false,
          displayOrder: 1,
        },
        {
          tierAr: 'نمو',
          tierEn: 'Growth',
          price: '35,000',
          isCustom: false,
          descAr: 'للشركات التي تبحث عن حضور رقمي متكامل.',
          descEn: 'For companies seeking a complete digital presence.',
          featuresAr: ['تطبيق ويب أو منصة SaaS سحابية', 'تصميم نظام متكامل UI/UX', 'دمج ذكاء اصطناعي أساسي', 'دعم فني لمدة 3 أشهر', 'تحسين أداء وسرعة متقدم'],
          featuresEn: ['Cloud-based web app or SaaS platform', 'Complete UI/UX system design', 'Basic AI integration', '3 months of technical support', 'Advanced performance & speed optimization'],
          featured: true,
          displayOrder: 2,
        },
        {
          tierAr: 'مؤسسات',
          tierEn: 'Enterprise',
          price: 'Custom',
          isCustom: true,
          descAr: 'حلول متكاملة للمؤسسات الكبرى والمشاريع المعقدة.',
          descEn: 'Comprehensive solutions for large enterprises and complex projects.',
          featuresAr: ['حلول ذكاء اصطناعي وأنظمة مخصصة', 'بنية تحتية قابلة للتوسع السحابي', 'فريق هندسي مخصص لمشروعك', 'شراكة ودعم مستمر 24/7'],
          featuresEn: ['Custom AI solutions and systems', 'Scalable cloud infrastructure', 'Dedicated engineering team for your project', '24/7 ongoing partnership & support'],
          featured: false,
          displayOrder: 3,
        },
      ],
    });
    console.log('✅ Default pricing plans seeded (migrated from the old hardcoded values).');
  }

  // 6c. Backward-compatible migration: copy the old single-language seo_title /
  // seo_description / seo_keywords settings (if they exist) into the new bilingual
  // seo_title_ar/seo_title_en (etc.) keys, without touching or deleting the old rows.
  // Safe to re-run: it only fills in keys that don't already exist.
  const legacySeoPairs: Array<[string, string]> = [
    ['seo_title', 'seo_title_ar'], ['seo_title', 'seo_title_en'],
    ['seo_description', 'seo_description_ar'], ['seo_description', 'seo_description_en'],
    ['seo_keywords', 'seo_keywords_ar'], ['seo_keywords', 'seo_keywords_en'],
  ];
  const legacySeoKeys = Array.from(new Set(legacySeoPairs.map(([oldKey]) => oldKey)));
  const existingSeoSettings = await prisma.setting.findMany({
    where: { key: { in: [...legacySeoKeys, ...legacySeoPairs.map(([, newKey]) => newKey)] } },
  });
  const existingSeoByKey = new Map(existingSeoSettings.map((s) => [s.key, s]));
  const seoMigrationsNeeded = legacySeoPairs.filter(
    ([oldKey, newKey]) => existingSeoByKey.has(oldKey) && !existingSeoByKey.has(newKey)
  );
  if (seoMigrationsNeeded.length > 0) {
    await Promise.all(
      seoMigrationsNeeded.map(([oldKey, newKey]) => {
        const oldSetting = existingSeoByKey.get(oldKey)!;
        return prisma.setting.create({
          data: { key: newKey, value: oldSetting.value, type: 'STRING', group: 'SEO', isPublic: true, description: `Migrated from legacy "${oldKey}"` },
        });
      })
    );
    console.log(`✅ Migrated ${seoMigrationsNeeded.length} legacy SEO setting(s) to the new bilingual keys.`);
  }

  // 7. Seed Projects if none exist
  const projectsCount = await prisma.project.count();
  if (projectsCount === 0 && adminUser) {
    await prisma.project.createMany({
      data: [
        {
          title: 'Lumen Finance',
          titleAr: 'Lumen Finance',
          titleEn: 'Lumen Finance',
          slug: 'lumen-finance',
          shortDescription: 'منصة مصرفية رقمية بتجربة سلسة وموثوقة.',
          shortDescriptionAr: 'منصة مصرفية رقمية بتجربة سلسة وموثوقة.',
          shortDescriptionEn: 'Digital banking platform with seamless and reliable experience.',
          description: 'منصة مصرفية رقمية متكاملة تقدم خدمات إدارة الأموال والمعاملات الآمنة بأسلوب عصري وسريع.',
          descriptionAr: 'منصة مصرفية رقمية متكاملة تقدم خدمات إدارة الأموال والمعاملات الآمنة بأسلوب عصري وسريع.',
          descriptionEn: 'Integrated digital banking platform providing money management and secure transactions.',
          status: 'ACTIVE',
          category: 'مواقع',
          categoryAr: 'مواقع',
          categoryEn: 'Web',
          type: 'WEB',
          typeAr: 'موقع',
          typeEn: 'WEB',
          coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
          featured: true,
          displayOrder: 1,
          createdBy: adminUser.id,
        },
        {
          title: 'Nexa Assistant',
          titleAr: 'Nexa Assistant',
          titleEn: 'Nexa Assistant',
          slug: 'nexa-assistant',
          shortDescription: 'مساعد ذكاء اصطناعي لخدمة العملاء الفورية.',
          shortDescriptionAr: 'مساعد ذكاء اصطناعي لخدمة العملاء الفورية.',
          shortDescriptionEn: 'AI assistant for instant customer service.',
          description: 'نظام ذكاء اصطناعي متطور للرد على استفسارات العملاء على مدار الساعة ورفع نسبة رضا المستفيدين.',
          descriptionAr: 'نظام ذكاء اصطناعي متطور للرد على استفسارات العملاء على مدار الساعة ورفع نسبة رضا المستفيدين.',
          descriptionEn: 'Advanced AI system to answer customer inquiries 24/7 and boost user satisfaction.',
          status: 'ACTIVE',
          category: 'ذكاء اصطناعي',
          categoryAr: 'ذكاء اصطناعي',
          categoryEn: 'AI',
          type: 'AI',
          typeAr: 'ذكاء اصطناعي',
          typeEn: 'AI',
          coverImage: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80',
          featured: true,
          displayOrder: 2,
          createdBy: adminUser.id,
        },
      ],
    });
    console.log('✅ Default projects seeded.');
  }

  // 8. Seed Testimonials if none exist
  const testimonialsCount = await prisma.testimonial.count();
  if (testimonialsCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        { name: 'سارة العتيبي', company: 'Lumen', position: 'مديرة تسويق', positionAr: 'مديرة تسويق', positionEn: 'Marketing Manager', rating: 5, content: 'فريق YF غيّر شكل حضورنا الرقمي بالكامل. النتائج فاقت التوقعات في أقل من شهرين.', contentAr: 'فريق YF غيّر شكل حضورنا الرقمي بالكامل. النتائج فاقت التوقعات في أقل من شهرين.', contentEn: 'YF team completely transformed our digital presence. Results exceeded expectations in under two months.', featured: true, displayOrder: 1 },
        { name: 'خالد المطيري', company: 'Orbit', position: 'مؤسس', positionAr: 'مؤسس', positionEn: 'Founder', rating: 5, content: 'احترافية عالية وسرعة تنفيذ لافتة. التصميم يعكس بالضبط الهوية التي كنا نتخيلها.', contentAr: 'احترافية عالية وسرعة تنفيذ لافتة. التصميم يعكس بالضبط الهوية التي كنا نتخيلها.', contentEn: 'High professionalism and remarkable execution speed. The design reflects exactly the identity we envisioned.', featured: true, displayOrder: 2 },
      ],
    });
    console.log('✅ Default testimonials seeded.');
  }

  console.log('🌱 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

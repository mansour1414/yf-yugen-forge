import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function resetMedia() {
  if (process.env.NODE_ENV === 'production' && process.env.CONFIRM_RESET_MEDIA !== 'yes') {
    console.error(
      '❌ Refusing to drop the media table: NODE_ENV=production.\n' +
      '   If you are absolutely sure, re-run with CONFIRM_RESET_MEDIA=yes.'
    );
    process.exit(1);
  }

  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "media" CASCADE;`);
  console.log('🗑️ Dropped media table successfully.');
}

resetMedia().catch(console.error).finally(() => prisma.$disconnect());

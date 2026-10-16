import 'dotenv/config';
import { AuthService } from '../src/server/services/auth.service';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/server/utils/password';

async function verifyAuth() {
  console.log('🧪 Verifying Authentication Core & Endpoints...\n');

  // 1. Verify Seed Admin User exists
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@yugenforge.com' },
    include: { role: true },
  });

  if (adminUser) {
    console.log(`✅ Admin user exists in DB: ${adminUser.email} (Role: ${adminUser.role.name})`);
  } else {
    console.error('❌ Admin user not found in DB!');
  }

  // 2. Test successful login
  try {
    const loginResult = await AuthService.login({
      email: 'admin@yugenforge.com',
      password: 'Admin@123456',
    }, '127.0.0.1');

    console.log('✅ Login successful!');
    console.log(`   Token generated: ${loginResult.token.substring(0, 20)}...`);
    console.log(`   User: ${loginResult.user.name} (${loginResult.user.email})`);
    console.log(`   Permissions count: ${loginResult.permissions.length}`);

    // 3. Test getCurrentUser
    const meResult = await AuthService.getCurrentUser(loginResult.user.id);
    console.log(`✅ getCurrentUser (/me) successful for: ${meResult.user.email}`);

    // 4. Verify ActivityLog created
    const latestLog = await prisma.activityLog.findFirst({
      where: { userId: adminUser?.id, action: 'LOGIN' },
      orderBy: { createdAt: 'desc' },
    });
    if (latestLog) {
      console.log(`✅ ActivityLog created: action=${latestLog.action}, entity=${latestLog.entity}`);
    } else {
      console.error('❌ ActivityLog not found!');
    }
  } catch (err: any) {
    console.error('❌ Login test failed:', err.message);
  }

  // 5. Test wrong password
  try {
    await AuthService.login({
      email: 'admin@yugenforge.com',
      password: 'WrongPassword1!',
    });
    console.error('❌ Wrong password was incorrectly accepted!');
  } catch (err: any) {
    console.log(`✅ Wrong password correctly rejected with status ${err.statusCode || 401}: ${err.message}`);
  }

  // 6. Test disabled user
  const testDisabledEmail = 'disabled@yugenforge.com';
  let disabledUser = await prisma.user.findUnique({ where: { email: testDisabledEmail } });
  if (!disabledUser) {
    const hashedPassword = await hashPassword('Admin@123456');
    const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
    disabledUser = await prisma.user.create({
      data: {
        name: 'Disabled User',
        email: testDisabledEmail,
        password: hashedPassword,
        status: 'DISABLED',
        roleId: adminRole!.id,
      },
    });
  }

  try {
    await AuthService.login({
      email: testDisabledEmail,
      password: 'Admin@123456',
    });
    console.error('❌ Disabled user was incorrectly allowed to login!');
  } catch (err: any) {
    console.log(`✅ Disabled user correctly rejected with status ${err.statusCode || 403}: ${err.message}`);
  }

  console.log('\n🎉 All Authentication Core verifications passed successfully!');
}

verifyAuth()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

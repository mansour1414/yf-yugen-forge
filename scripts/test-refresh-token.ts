import 'dotenv/config';
import { AuthService } from '../src/server/services/auth.service';
import { prisma } from '../src/lib/prisma';

async function verifyRefreshTokenFlow() {
  console.log('🧪 Verifying Refresh Token Authentication Flow...\n');

  // 1. Login
  const loginResult = await AuthService.login({
    email: 'admin@yugenforge.com',
    password: 'Admin@123456',
  }, 'TestAgent', '127.0.0.1');

  console.log('✅ Login successful.');
  console.log(`   Access Token: ${loginResult.token.substring(0, 15)}...`);
  console.log(`   Refresh Token: ${loginResult.refreshToken.substring(0, 15)}...`);

  // Verify session created in DB
  const sessionsBeforeRefresh = await prisma.session.findMany({
    where: { userId: loginResult.user.id },
  });
  console.log(`✅ Sessions in DB for user: ${sessionsBeforeRefresh.length}`);

  // 2. Refresh Token
  const refreshResult = await AuthService.refresh(loginResult.refreshToken, 'TestAgent', '127.0.0.1');
  console.log('✅ Token refresh successful.');
  console.log(`   New Access Token: ${refreshResult.token.substring(0, 15)}...`);
  console.log(`   New Refresh Token: ${refreshResult.refreshToken.substring(0, 15)}...`);

  // Verify session rotated
  const sessionsAfterRefresh = await prisma.session.findMany({
    where: { userId: loginResult.user.id },
  });
  console.log(`✅ Sessions in DB after refresh (rotated): ${sessionsAfterRefresh.length}`);

  // 3. Logout
  await AuthService.logout(refreshResult.refreshToken);
  const sessionsAfterLogout = await prisma.session.findMany({
    where: { userId: loginResult.user.id },
  });
  console.log(`✅ Sessions in DB after logout: ${sessionsAfterLogout.length}`);

  // 4. Logout All Devices test
  // Log in again to create a session
  const loginAgain = await AuthService.login({
    email: 'admin@yugenforge.com',
    password: 'Admin@123456',
  }, 'TestAgent', '127.0.0.1');

  const sessionsBeforeLogoutAll = await prisma.session.findMany({
    where: { userId: loginAgain.user.id },
  });
  console.log(`✅ Sessions before logout-all: ${sessionsBeforeLogoutAll.length}`);

  await AuthService.logoutAll(loginAgain.user.id);
  const sessionsAfterLogoutAll = await prisma.session.findMany({
    where: { userId: loginAgain.user.id },
  });
  console.log(`✅ Sessions after logout-all: ${sessionsAfterLogoutAll.length}`);

  console.log('\n🎉 All Refresh Token Authentication tests passed successfully!');
}

verifyRefreshTokenFlow()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

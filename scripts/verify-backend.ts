import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { AuthService } from '../src/server/services/auth.service';
import app from '../src/server/app';
import http from 'http';

async function verify() {
  console.log('🔍 Verifying Database Tables...');
  const servicesCount = await prisma.service.count();
  const projectsCount = await prisma.project.count();
  const heroCount = await prisma.heroSection.count();
  const testimonialsCount = await prisma.testimonial.count();
  const usersCount = await prisma.user.count();
  const rolesCount = await prisma.role.count();

  console.log({
    servicesCount,
    projectsCount,
    heroCount,
    testimonialsCount,
    usersCount,
    rolesCount,
  });

  if (servicesCount === 0 || projectsCount === 0 || heroCount === 0 || testimonialsCount === 0 || usersCount === 0 || rolesCount === 0) {
    throw new Error('Some tables are empty!');
  }
  console.log('✅ All 6 tables contain records.');

  console.log('🔑 Verifying Admin Login...');
  const loginResult = await AuthService.login({
    email: 'admin@yugenforge.com',
    password: 'Admin@123456',
  }, '127.0.0.1', 'TestAgent');
  
  if (loginResult && loginResult.token) {
    console.log('✅ Admin login verified successfully! Token received.');
  } else {
    throw new Error('Admin login failed');
  }

  console.log('🚀 Testing Express Server endpoints...');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5001, resolve));

  const fetchJson = (path: string) => {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:5001${path}`, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON from ${path}: ${data}`));
          }
        });
      }).on('error', reject);
    });
  };

  const servicesRes: any = await fetchJson('/api/public/services');
  const projectsRes: any = await fetchJson('/api/public/projects');
  const heroRes: any = await fetchJson('/api/public/hero');

  console.log('/api/public/services count:', Array.isArray(servicesRes) ? servicesRes.length : servicesRes);
  console.log('/api/public/projects count:', Array.isArray(projectsRes) ? projectsRes.length : projectsRes);
  console.log('/api/public/hero title:', heroRes?.data?.title || heroRes?.title);

  server.close();
  await prisma.$disconnect();
  console.log('🎉 Backend and Database initialization verified successfully!');
}

verify().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

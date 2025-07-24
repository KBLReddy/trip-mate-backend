// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  
  // Only seed in non-production environments
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Skipping seed in production environment');
    return;
  }

  // Create admin user with isVerified: true
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tripmate.com' },
    update: {},
    create: {
      email: 'admin@tripmate.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      isVerified: true, // Add this
    },
  });

  // Create guide user with isVerified: true
  const guidePassword = await bcrypt.hash('guide123', 10);
  const guide = await prisma.user.upsert({
    where: { email: 'guide@tripmate.com' },
    update: {},
    create: {
      email: 'guide@tripmate.com',
      name: 'Tour Guide',
      passwordHash: guidePassword,
      role: Role.GUIDE,
      isVerified: true, // Add this
    },
  });

  // Create test user with isVerified: true
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@tripmate.com' },
    update: {},
    create: {
      email: 'user@tripmate.com',
      name: 'Test User',
      passwordHash: userPassword,
      role: Role.USER,
      isVerified: true, // Add this
    },
  });

  // Rest of your seed code remains the same...
  // [Keep the rest of your seed code as is]
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@evcalculator.com' },
      update: {},
      create: {
        email: 'admin@evcalculator.com',
        passwordHash: hashedPassword,
        name: 'Admin User',
        role: 'admin',
      },
    }),
    prisma.user.upsert({
      where: { email: 'user@evcalculator.com' },
      update: {},
      create: {
        email: 'user@evcalculator.com',
        passwordHash: hashedPassword,
        name: 'Regular User',
        role: 'user',
      },
    }),
    prisma.user.upsert({
      where: { email: 'demo@evcalculator.com' },
      update: {},
      create: {
        email: 'demo@evcalculator.com',
        passwordHash: hashedPassword,
        name: 'Demo User',
        role: 'user',
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);
  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

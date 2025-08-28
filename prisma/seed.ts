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

  // Create EV Cars
  console.log('Creating EV cars...');
  const evCars = await Promise.all([
    prisma.evCar.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Tesla Model 3',
        batteryCapacityKwh: 75.0,
        kwhPerBaht: 0.25,
        userId: users[0].id, // Admin user
      },
    }),
    prisma.evCar.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'BMW i3',
        batteryCapacityKwh: 42.2,
        kwhPerBaht: 0.28,
        userId: users[1].id, // Regular user
      },
    }),
    prisma.evCar.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Nissan Leaf',
        batteryCapacityKwh: 40.0,
        kwhPerBaht: 0.30,
        userId: users[1].id, // Regular user
      },
    }),
    prisma.evCar.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: 'MG ZS EV',
        batteryCapacityKwh: 44.5,
        kwhPerBaht: 0.32,
        userId: users[2].id, // Demo user
      },
    }),
  ]);

  console.log(`Created ${evCars.length} EV cars`);

  // Create Charges (100 per EV car)
  console.log('Creating charge records...');
  
  // Function to generate realistic charging data
  function generateChargeData() {
    const startPct = Math.floor(Math.random() * 80) + 5; // 5-84%
    const endPct = Math.floor(Math.random() * (100 - startPct)) + startPct + 10; // at least 10% charge gain
    
    // Generate random date within the last 3 months
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
    console.log(randomTime);
    const createdAt = new Date(randomTime);
    
    return { 
      startPct, 
      endPct: Math.min(endPct, 100),
      createdAt
    };
  }

  const charges = [];
  let chargeId = 1;

  // Create 100 charges for each EV car
  for (const evCar of evCars) {
    console.log(`Creating charges for ${evCar.name}...`);
    
    for (let i = 0; i < 100; i++) {
      const { startPct, endPct, createdAt } = generateChargeData();
      
      const charge = await prisma.charge.upsert({
        where: { id: chargeId },
        update: {},
        create: {
          startPct,
          endPct,
          evCarId: evCar.id,
          createdAt,
        },
      });
      
      charges.push(charge);
      chargeId++;
    }
  }

  console.log(`Created ${charges.length} charge records`);
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

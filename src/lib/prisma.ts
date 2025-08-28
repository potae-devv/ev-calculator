import { Prisma, PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `globalThis` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Type exports for convenience
export type { User as PrismaUser, EvCar, Charge } from '@prisma/client';

// Define AuthUser interface for user data returned by utility functions
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

// Define UserWithPassword interface for authentication functions
export interface UserWithPassword extends User {
  passwordHash: string;
}

// User operations
export async function findUserByEmail(email: string): Promise<UserWithPassword | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
    },
  });

  return user;
}

export async function findUserById(id: number): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return user;
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string,
  role: string = 'user'
): Promise<User> {
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return user;
}

export async function getAllUsers(): Promise<User[]> {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function updateUser(
  id: number,
  data: {
    email?: string;
    name?: string;
    role?: string;
  }
): Promise<User> {
  return await prisma.user.update({
    where: { id },
    data: {
      ...data,
      email: data.email?.toLowerCase(),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
}

export async function deleteUser(id: number): Promise<void> {
  await prisma.user.delete({
    where: { id },
  });
}

// Database health check
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// EV Car operations
export async function createEVCar(
  userId: number,
  data: {
    name: string;
    batteryCapacityKwh: number;
    kwhPerBaht: number;
  }
) {
  return await prisma.evCar.create({
    data: {
      ...data,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getUserEVCars(userId: number) {
  return await prisma.evCar.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getAllEVCars() {
  return await prisma.evCar.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getEVCarById(id: number) {
  return await prisma.evCar.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateEVCar(
  id: number,
  data: {
    name?: string;
    batteryCapacityKwh?: number;
    kwhPerBaht?: number;
  }
) {
  return await prisma.evCar.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function deleteEVCar(id: number) {
  return await prisma.evCar.delete({
    where: { id },
  });
}



// Charge operations
export async function createCharge(
  evCarId: number,
  data: {
    startPct: number;
    endPct: number;
  }
) {
  return await prisma.charge.create({
    data: {
      ...data,
      evCarId,
    },
    include: {
      evCar: {
        select: {
          id: true,
          name: true,
          userId: true,
          batteryCapacityKwh: true,
          kwhPerBaht: true,
        },
      },
    },
  });
}

export async function getChargesByEvCar(evCarId: number) {
  return await prisma.charge.findMany({
    where: { evCarId },
    orderBy: { createdAt: 'desc' },
    include: {
      evCar: {
        select: {
          id: true,
          name: true,
          userId: true,
          batteryCapacityKwh: true,
          kwhPerBaht: true,
        },
      },
    },
  });
}

export async function getChargesByEvCarWithDateFilter(
  evCarId: number, 
  startDate?: string, 
  endDate?: string
) {
  const whereClause: Prisma.ChargeWhereInput = { evCarId };

  // Add date filters if provided
  if (startDate || endDate) {
    whereClause.createdAt = {};
    
    if (startDate) {
      whereClause.createdAt.gte = new Date(startDate);
    }
    
    if (endDate) {
      // Add time to end date to include the entire day
      const endDateTime = new Date(endDate + 'T23:59:59.999Z');
      whereClause.createdAt.lte = endDateTime;
    }
  }

  return await prisma.charge.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      evCar: {
        select: {
          id: true,
          name: true,
          userId: true,
          batteryCapacityKwh: true,
          kwhPerBaht: true,
        },
      },
    },
  });
}

export async function getChargesByUser(userId: number) {
  console.log("userId", userId);

  return await prisma.charge.findMany({
    where: {
      evCar: {
        userId,
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      evCar: {
        select: {
          id: true,
          name: true,
          userId: true,
          batteryCapacityKwh: true,
          kwhPerBaht: true,
        },
      },
    },
  });
}

export async function getChargeById(id: number) {
  return await prisma.charge.findUnique({
    where: { id },
    include: {
      evCar: {
        select: {
          id: true,
          name: true,
          userId: true,
          batteryCapacityKwh: true,
          kwhPerBaht: true,
        },
      },
    },
  });
}

export async function updateCharge(
  id: number,
  data: {
    startPct?: number;
    endPct?: number;
  }
) {
  return await prisma.charge.update({
    where: { id },
    data,
    include: {
      evCar: {
        select: {
          id: true,
          name: true,
          userId: true,
          batteryCapacityKwh: true,
          kwhPerBaht: true,
        },
      },
    },
  });
}

export async function deleteCharge(id: number) {
  return await prisma.charge.delete({
    where: { id },
  });
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

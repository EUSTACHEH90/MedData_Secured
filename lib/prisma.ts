// import { PrismaClient } from "@prisma/client";

// const prisma = globalThis.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// export default prisma;


import { PrismaClient } from "@prisma/client";

declare global {
  // Déclare la propriété prisma sur globalThis
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;

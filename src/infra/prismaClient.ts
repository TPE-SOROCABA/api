import { Prisma, PrismaClient } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
const prisma = new PrismaClient();

type IPrismaTransaction = Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
type IPrisma = typeof prisma;

export { prisma, IPrismaTransaction, IPrisma };

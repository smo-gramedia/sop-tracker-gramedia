import 'dotenv/config'
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
//https://chatgpt.com/s/t_6a7a705df3ac8191bbc80cde9eb7dead
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: Number.parseInt(process.env.DATABASE_PORT || "3306"),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  allowPublicKeyRetrieval: process.env.NODE_ENV === "development",
});
export const prisma = new PrismaClient({ adapter });
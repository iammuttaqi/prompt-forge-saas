import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  initialized: boolean | undefined;
};

function ensureServerlessDatabase(): string {
  // If remote database URL is configured, use it directly
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );

  if (isServerless) {
    const tmpDbPath = path.join("/tmp", "prompt_forge.db");

    try {
      if (!fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0) {
        console.log("[Prisma Serverless] Initializing /tmp/prompt_forge.db from starter bundle...");

        const candidateSources = [
          path.join(process.cwd(), "prisma", "starter.db"),
          path.join(process.cwd(), "public", "starter.db"),
          path.join("/var/task", "prisma", "starter.db"),
          path.join("/var/task", "public", "starter.db"),
          path.join(__dirname, "..", "prisma", "starter.db"),
          path.join(__dirname, "starter.db"),
        ];

        let copied = false;
        for (const src of candidateSources) {
          if (fs.existsSync(src)) {
            try {
              fs.copyFileSync(src, tmpDbPath);
              fs.chmodSync(tmpDbPath, 0o666);
              console.log(`[Prisma Serverless] Successfully copied starter db from ${src} to ${tmpDbPath} (${fs.statSync(tmpDbPath).size} bytes)`);
              copied = true;
              break;
            } catch (copyErr) {
              console.error(`[Prisma Serverless] Failed to copy from ${src}:`, copyErr);
            }
          }
        }

        if (!copied) {
          console.warn("[Prisma Serverless] Starter DB file not found in candidates. Creating empty DB file at", tmpDbPath);
          fs.writeFileSync(tmpDbPath, "");
          fs.chmodSync(tmpDbPath, 0o666);
        }
      }
    } catch (fsErr) {
      console.error("[Prisma Serverless] Filesystem error while preparing /tmp SQLite DB:", fsErr);
    }

    return `file:${tmpDbPath}`;
  }

  // Local development / testing:
  const localDb = path.join(process.cwd(), "prisma", "prompt_forge.db");
  if (fs.existsSync(localDb)) {
    return `file:${localDb}`;
  }

  return process.env.DATABASE_URL || "file:./prisma/prompt_forge.db";
}

const activeDbUrl = ensureServerlessDatabase();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

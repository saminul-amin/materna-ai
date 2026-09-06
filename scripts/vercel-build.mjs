/**
 * Vercel build script.
 *
 * Local development uses SQLite (prisma/schema.prisma). On Vercel the filesystem is ephemeral,
 * so this script derives a PostgreSQL schema from the same file, generates the client for it,
 * pushes the schema to the database provided by the Vercel Postgres/Neon integration, and then
 * runs `next build`. No second schema file has to be maintained by hand.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Connect a Postgres resource (e.g. Neon) to this Vercel project.");
  process.exit(1);
}
if (!/^postgres(ql)?:\/\//.test(url)) {
  console.error("DATABASE_URL must be a PostgreSQL connection string on Vercel (got: " + url.split(":")[0] + ").");
  process.exit(1);
}

// Neon's integration exposes an unpooled URL that is safer for schema pushes.
const direct = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;
if (direct) process.env.DIRECT_DATABASE_URL = direct;

const original = readFileSync("prisma/schema.prisma", "utf8");
let schema = original.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
if (schema === original) {
  console.error('Could not find provider = "sqlite" in prisma/schema.prisma; refusing to continue.');
  process.exit(1);
}
if (direct) schema = schema.replace(/(url\s*=\s*env\("DATABASE_URL"\))/, '$1\n  directUrl = env("DIRECT_DATABASE_URL")');
writeFileSync("prisma/schema.postgres.prisma", schema);
console.log("Derived Postgres schema:", schema.match(/datasource db \{[\s\S]*?\}/)?.[0].replace(/\s+/g, " "));

const run = (cmd) => {
  console.log("> " + cmd);
  execSync(cmd, { stdio: "inherit", env: process.env });
};

run("npx prisma generate --schema prisma/schema.postgres.prisma");
run("npx prisma db push --schema prisma/schema.postgres.prisma --accept-data-loss --skip-generate");
run("npx next build");

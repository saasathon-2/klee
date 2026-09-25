import { Pool } from "pg";
import { env } from "./env.ts";

export const pool = new Pool({ connectionString: env.databaseUrl });

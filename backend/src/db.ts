import { Pool, type PoolClient } from "pg";
import { env } from "./env.ts";

export const pool = new Pool({ connectionString: env.databaseUrl });

/** Runs `work` inside a transaction, rolling back if it throws. */
export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
	const client = await pool.connect();
	try {
		await client.query("begin");
		const result = await work(client);
		await client.query("commit");
		return result;
	} catch (error) {
		await client.query("rollback");
		throw error;
	} finally {
		client.release();
	}
}

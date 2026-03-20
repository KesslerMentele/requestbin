import pg from 'pg'
import {PGSecret} from "../types";
import {getSecret} from "../services/secretService";


let postgresPool: pg.Pool | null = null;

async function loadPGConfig(): Promise<PGSecret> {
  return await getSecret<PGSecret>("CAPSTONE/PG_RDS/PG_CREDENTIALS")
}

export async function initPostgres(): Promise<void> {
  if (postgresPool) return;
  const config = await loadPGConfig();
  postgresPool = new pg.Pool({
    host: config.host,
    port: config.port,
    database: config.dbInstanceIdentifier,
    user: config.username,
    password: config.password,
    ssl: { rejectUnauthorized: false, ca: require('fs').readFileSync('./global-bundle.pem').toString() }
  });
  console.log("Postgres pool initialized: ", postgresPool);
}

export function getPostgresPool(): pg.Pool {
  if (!postgresPool) throw new Error("Postgres pool not initialized");
  return postgresPool;
}

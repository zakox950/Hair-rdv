import { Pool } from 'pg';

const pool = new Pool({
  host:     process.env.PGHOST     ?? 'localhost',
  port:     Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? 'hairrdv',
  user:     process.env.PGUSER     ?? 'postgres',
  password: process.env.PGPASSWORD ?? 'postgres',
});

export default pool;

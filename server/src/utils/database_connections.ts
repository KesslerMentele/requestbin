import mongoose from 'mongoose';
import pg from 'pg'
import dotenv from 'dotenv';
dotenv.config();


if (!process.env.PGHOST || !process.env.PGPORT || !process.env.PGDATABASE || !process.env.PGUSER
  || !process.env.PGPASSWORD
) {
  throw new Error('Missing required variables in env file to run postgres')
}

export const postgresPool = new pg.Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false, ca: require('fs').readFileSync('./global-bundle.pem').toString() }
});

if (!process.env.MONGO_CONNECTION_STRING) {
  throw new Error('Missing required environment variable: MONGO_CONNECTION_STRING')
}
export const mongoDBConnect = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION_STRING as string)
    console.log("MongoDB connected")
  } catch (err) {
    console.error("MongoDB connection error:", err)
  }
};
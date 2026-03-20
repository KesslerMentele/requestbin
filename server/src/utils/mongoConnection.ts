import { getSecret } from "../services/secretService";
import {DocDBSecret} from "../types";
import mongoose from "mongoose";

let initialized = false;


async function loadMongoConfig(): Promise<DocDBSecret> {
  return await getSecret<DocDBSecret>("CAPSTONE/DOC_DB/DOC_DB_CREDENTIALS")
}

export async function initMongo(): Promise<void> {
  if (initialized) return;

  const config = await loadMongoConfig();

  const uri = `mongodb://${config.username}:${config.password}` +
    `@${config.host}:${config.port}/?ssl=${config.ssl ? "true" : "false"}` +
    `requestsdb?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`;

  await mongoose.connect(uri);

  initialized = true;
}

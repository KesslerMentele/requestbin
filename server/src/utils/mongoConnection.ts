import { getSecret } from "../services/secretService";
import {DocDBSecret} from "../types";
import mongoose from "mongoose";
import path from "path";

let initialized = false;


async function loadMongoConfig(): Promise<DocDBSecret> {
  return await getSecret<DocDBSecret>("CAPSTONE/DOC_DB/DOC_DB_CREDENTIALS")
}

export async function initMongo(): Promise<void> {
  if (initialized) return;

  const config = await loadMongoConfig();

  const username = encodeURIComponent(config.username);
  const password = encodeURIComponent(config.password);

  const uri = `mongodb://${username}:${password}@${config.host}:${config.port}` +
    `/requestsdb?replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`;

  await mongoose.connect(uri, {
    tls: config.ssl,
    tlsCAFile: path.resolve(__dirname, "../../global-bundle.pem"),
  });

  initialized = true;
}

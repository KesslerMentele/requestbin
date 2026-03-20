import {InsertOneResult, DeleteResult, WithId, ObjectId} from "mongodb";

export type FormattedRequest = {
  id: any,
  bin_name: any,
  time_of_day: string | undefined,
  date_stamp: string | undefined,
  http_method: any,
  body: any,
  headers: any,
  path: any,
  query_params: any
};

export type MongoRequestDocument = {
  request: unknown;
};

export type RequestPayload = {
  [key: string]: unknown;
};

export type ValidMongoId = string | ObjectId | Uint8Array;

export interface MongoService {
  findRequest(id:string): Promise<WithId<MongoRequestDocument> | null>;
  findAllRequests(ids: string[]): Promise<WithId<MongoRequestDocument>[]>;
  insertRequest(requestPayload: unknown): Promise<InsertOneResult<MongoRequestDocument>>;
  deleteRequestsFromBin(ids: string[]): Promise<DeleteResult>;
  deleteRequest(id: string): Promise<DeleteResult>;
}

export type BinRow = {
  id: number;
  name: string;
};

export type RequestRow = {
  id: number;
  bin_name: string;
  mongodb_id: string;
  time_stamp?: string;
  http_method: string;
};

export interface PostgresService {
  getAllBins(): Promise<string[]>;
  getAllRequests(binName: string): Promise<RequestRow[]>;
  createBin(binName: string): Promise<BinRow>;
  deleteBin(binName: string): Promise<void>;
  deleteRequest(id: number, binName: string): Promise<string>;
  deleteAllRequestsFromBin(binName: string): Promise<void>;
  insertRequest(
    binName: string,
    mongodbID: string,
    httpMethod: string
  ): Promise<RequestRow>;
}

export type PGSecret = {
  username: string;
  password: string;
  engine: string;
  host: string;
  port: number;
  dbInstanceIdentifier: string;
};

export type DocDBSecret = {
  username: string;
  password: string;
  engine: string;
  host: string;
  port: string;
  ssl: boolean;
  dbClusterIdentifier: string;
};
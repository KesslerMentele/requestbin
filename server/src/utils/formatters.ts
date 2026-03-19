import {FormattedRequest, ValidMongoId} from "../types";
import {ObjectId} from "mongodb";

export const formatTimeOfDay = (date: Date): string =>
  date.toTimeString().split(' ')[0]!;

export const formatDateStamp = (date: Date): string =>
  date.toLocaleDateString('en-GB').replace(/\//g, ':');

export const isRequestPayload = (payload: unknown): payload is Record<string, unknown> =>
  typeof payload === 'object' && payload !== null;

export const isValidMongoId = (id: string | ObjectId | Uint8Array): id is ValidMongoId =>
  ObjectId.isValid(id);

export const toFormattedRequest = (row: any, mongoDoc?: any):FormattedRequest => ({
  id: row.id,
  bin_name: row.bin_name,
  time_of_day: row.time_stamp ? formatTimeOfDay(row.time_stamp) : undefined,
  date_stamp: row.time_stamp ? formatDateStamp(row.time_stamp) : undefined,
  http_method: row.http_method,
  body: mongoDoc?.request?.body ?? {},
  headers: mongoDoc?.request?.headers ?? {},
  path: mongoDoc?.request?.path ?? {},
  query_params: mongoDoc?.request?.query_params ?? {},
});
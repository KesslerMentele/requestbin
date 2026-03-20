import mongoose from "mongoose";
import {MongoService, MongoRequestDocument, ValidMongoId} from "../types";
import { DeleteResult, InsertOneResult, WithId, ObjectId} from "mongodb";
import {isValidMongoId, isRequestPayload} from "../utils/formatters";


const collection = () =>
  mongoose.connection.collection<MongoRequestDocument>("requests")

const findRequest = async (id: string): Promise<WithId<MongoRequestDocument> | null> => {
    return collection().findOne({ _id: new ObjectId(id) })
}

const findAllRequests = async (ids: string[]): Promise<WithId<MongoRequestDocument>[]> => {
    const validIds = ids.filter(id => isValidMongoId(id));
    const objectIds = validIds.map((id) => new ObjectId(id));
    return collection().find({
        _id: { $in: objectIds }
    }).toArray();
}

const insertRequest = async (request_payload: unknown): Promise<InsertOneResult<MongoRequestDocument>> => {
    if (isRequestPayload(request_payload)) {
      return collection().insertOne({
          request: request_payload
          //returns object {acknowledged: true||false, insertedId: new ObjectId({id})}
      })
    }

    throw new Error("Request payload is invalid")
}

const deleteRequestsFromBin = async (ids: string[]): Promise<DeleteResult> => {
    const validIds: ValidMongoId[] = ids.filter(id => isValidMongoId(id));
    const objectIds: ObjectId[] = validIds.map((id) => new ObjectId(id));

    return await collection().deleteMany({
        _id: { $in: objectIds }
    });
}

const deleteRequest = async (id: string): Promise<DeleteResult> => {
  if (isValidMongoId(id)) {
    return await collection().deleteOne({
      _id: new mongoose.Types.ObjectId(id)
    });
  }
  throw new Error(`Invalid MongoDB ID: ${id}`);
}


const mongoService: MongoService = {
  findRequest,
  findAllRequests,
  insertRequest,
  deleteRequestsFromBin,
  deleteRequest
}
export default mongoService;
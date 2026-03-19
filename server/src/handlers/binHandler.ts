import {Request, Response} from 'express';
import pgService from "../services/pgService";
import mongoService from "../services/mongoService";
import {toFormattedRequest} from "../utils/formatters";

const createBin = async (req: Request, res: Response) => {
  try {
    const binName = req.body.bin_name;
    const pgRow = await pgService.createBin(binName);
    res.status(201).json({ id: pgRow.name });
  } catch (error) {
    console.error("Error creating bin:", error);
    res.status(400).json({
      error: "server error",
      msg: "Could not create bin at this time."
    })
  }
};

const deleteBin = async (req: Request, res: Response) => {
  try {
    const binName = req.params.binName as string;
    const pgRequests = await pgService.getAllRequests(binName);
    const mongoIDs = pgRequests.map((request) => request.mongodb_id);

    await mongoService.deleteRequestsFromBin(mongoIDs)
    await pgService.deleteBin(binName)
    res.status(204).send()
  } catch (error) {
    console.error("Error deleting bin:", error);
    res.status(500).json({
      error: "server error",
      msg: "Could not delete bin at this time."
    });

  }
};

const getAllBins = async (_req: Request, res: Response) => {
  try {
    const result = await pgService.getAllBins();

    res.json({ bin_names: result })
  } catch (error) {
    console.error("Error fetching bins:", error);
    res.status(500).json({
      error: "server error",
      msg: "Could not retrieve bins at this time."
    })
  }
}

const deleteAllRequestsFromBin = async (req: Request, res: Response) => {
  try {
    const binName = req.params.binName as string;
    const pgRequests = await pgService.getAllRequests(binName);
    const mongoIDs = pgRequests.map((request) => request.mongodb_id);

    await mongoService.deleteRequestsFromBin(mongoIDs)
    await pgService.deleteAllRequestsFromBin(binName)
    res.status(204).send()
  } catch (error) {
    console.error("Error deleting requests:", error);
    res.status(500).json({
      error: "server error",
      msg: "Could not delete requests at this time."
    });

  }
}

const getAllRequestsForBin = async (req: Request, res: Response) => {
  try {
    const binName = req.params.binName as string;
    // pull out all requests by bin name
    const pgRequests = await pgService.getAllRequests(binName);

    // pull out all mongo ids inside to get a list of ids
    const mongoIDs = pgRequests.map((request) => request.mongodb_id);

    // use an array of mongo ids as an argument for a mongo query
    const mongoRequests = await mongoService.findAllRequests(mongoIDs);

    // what is the shape of the JSON
    const mongoMap = new Map(
      mongoRequests.map((doc: any) => [doc._id.toString(), doc])
    );


    // 5. Merge and shape the final response
    const finalResult = pgRequests.map(row => {
      const mongoDoc = mongoMap.get(row.mongodb_id);
      return toFormattedRequest(row, mongoDoc);

    });

    res.status(200).json(finalResult);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({
      error: "server error",
      msg: "Could not retrieve requests at this time."
    })
  }
}

const deleteRequest = async (req: Request, res: Response) => {
  try {
    const binName = req.params.binName as string;
    const requestId = Number(req.params.requestId)

    const mongodb_id = await pgService.deleteRequest(requestId, binName);
    await mongoService.deleteRequest(mongodb_id);

    res.status(204).send()
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(400).json({
      error: "server error",
      msg: "Could not delete request at this time."
    })
  }
}
export {
  createBin,
  getAllBins,
  deleteBin,
  deleteAllRequestsFromBin,
  getAllRequestsForBin,
  deleteRequest
}

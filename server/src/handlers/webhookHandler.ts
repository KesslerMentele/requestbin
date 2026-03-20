import mongoService from "../services/mongoService";
import {toFormattedRequest} from "../utils/formatters"
import {broadcastToBin} from "./websocketHandler";
import {Request, RequestHandler, Response} from 'express';
import {PostgresService} from "../types";


const createWebhookHandler = (pgService:PostgresService): RequestHandler => {
  return async (req: Request, res: Response)  => {
    const binName = req.params.binName as string;

    if (!binName) {
      return res.status(400).json({
        error: "bad request",
        msg: "Bin name is missing in the request parameters",
      });
    }

    try {
      const requestDocument = {
        headers: req.headers,
        body: req.body,
        path: req.originalUrl,
        query_params: req.query,
      };

      const insertResult = await mongoService.insertRequest(requestDocument);
      const mongoId = insertResult.insertedId.toString();

      const pgRow = await pgService.insertRequest(binName, mongoId, req.method);

      broadcastToBin(binName, toFormattedRequest(pgRow, requestDocument));
      return res.status(202).send();
    } catch (error) {
      console.error("Error: ", error);
      return res.status(500).json({
        error: "server error",
        msg: "Could not record request at this time.",
      });
    }
  };

}

export default createWebhookHandler;
import mongoService from "../services/mongoService";
import pgService from "../services/pgService";
import {toFormattedRequest} from "../utils/formatters"
import {broadcastToBin} from "./websocketHandler";
import { Request, Response } from 'express';

export const webhookHandler = async (req: Request, res: Response) => {
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
    res.status(202).send();
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({
      error: "server error",
      msg: "Could not record request at this time.",
    });
  }
};



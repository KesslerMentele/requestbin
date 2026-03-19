import {Router} from "express";
import {
  createBin,
  deleteAllRequestsFromBin,
  deleteBin,
  deleteRequest,
  getAllBins,
  getAllRequestsForBin
} from "../handlers/binHandler";

const binRouter = Router();


// creates a new bin with the name: 201, 400 if a bad name, 409 if name conflict
binRouter.post('/', createBin)

// get all bins     returns [{ id: string }]
binRouter.get('/', getAllBins)

// deletes a bin
binRouter.delete('/:binName',  deleteBin)

//delete requests in a bin
binRouter.delete('/:binName/requests', deleteAllRequestsFromBin);

// get all requests for a given bin
binRouter.get('/:binName/requests', getAllRequestsForBin)

binRouter.delete('/:binName/requests/:requestId', deleteRequest)

export default binRouter;
import {Router} from "express";
import {PostgresService} from "../types";
import createBinHandler from "../handlers/binHandler";


const createBinRouter = (pgService:PostgresService): Router => {

  const binRouter = Router();
  const binHandler = createBinHandler(pgService);

  // creates a new bin with the name: 201, 400 if a bad name, 409 if name conflict
  binRouter.post('/', binHandler.createBin)

  // get all bins     returns [{ id: string }]
  binRouter.get('/', binHandler.getAllBins)

  // deletes a bin
  binRouter.delete('/:binName',  binHandler.deleteBin)

  //delete requests in a bin
  binRouter.delete('/:binName/requests', binHandler.deleteAllRequestsFromBin);

  // get all requests for a given bin
  binRouter.get('/:binName/requests', binHandler.getAllRequestsForBin)

  binRouter.delete('/:binName/requests/:requestId', binHandler.deleteRequest)

  return binRouter;
}
export default createBinRouter;
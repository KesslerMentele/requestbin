import express, { Request, Response } from 'express';
import { mongoDBConnect } from "./utils/database_connections"
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import {
    insertIntoMongo,
    postgresGetAllBins,
    postgresGetAllRequests,
    postgresCreateBin,
    postgresDeleteBin,
    postgresDeleteRequest,
    postgresInsertRequest,
    mongoFindAllRequestById,
    mongoDeleteRequest,
    mongoDeleteRequestsFromBin,
    postgresDeleteAllRequestsFromBin,
} from './utils/database_queries';
import cors from 'cors';

const app = express();

// app.use(cors({
//     origin: (origin, callback) => {
//         const allowed = !origin || ['http://localhost:3000', 'https://forkless-tamesha-unphlegmatically.ngrok-free.dev/', 'http://localh>
//         callback(null, allowed ? origin : false);
//     } }));

app.use(cors({ origin: true }));
app.use(express.json());
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' })

const binSubscribers = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws) => {
    let subscribedBin: string | null = null;
    console.log("websocket connection")
    ws.on('message', (message) => {
        console.log("websocket message");
        try {
            const { binName } = JSON.parse(message.toString());

            subscribedBin = binName;
            if (!binSubscribers.has(binName)) {
                binSubscribers.set(binName, new Set());
            }
            //ensures add is not null or undefined with !
            binSubscribers.get(binName)!.add(ws);
            console.log("websocket");
            ws.send(JSON.stringify({ event: 'subscribed', binName }))
        } catch (error) {
            console.error('WebSocket message error:', error);
            ws.send(JSON.stringify({ event: 'error', msg: 'Invalid message format' }));
        }

    });
    ws.on('close', () => {
        if (subscribedBin) {
            binSubscribers.get(subscribedBin)?.delete(ws);
        }
    });
});

//send data to all clients watching a specific bin
const broadcastToBin = (binName: string, data: object) => {
    const subscribers = binSubscribers.get(binName)
    if (!subscribers) return;
    const payload = JSON.stringify(data);
    subscribers.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload)
        }
    });
}

app.get('/', (req: Request, res: Response) => {
    res.send("Hello World!")
})

// creates new bin with name: 201, 400 if bad name, 409 if name conflict
app.post('/api/bins', async (req: Request, res: Response) => {
    try {
        const binName = req.body.bin_name;
        const pgRow = await postgresCreateBin(binName);
        res.status(201).json({ id: pgRow.name });
    } catch (error) {
        console.error("Error creating bin:", error);
        res.status(400).json({
            error: "server error",
            msg: "Could not create bin at this time."
        })
    }
})

// get all bins     returns [{ id: string }]
app.get('/api/bins', async (req: Request, res: Response) => {
    try {
        const result = await postgresGetAllBins();

        res.json({ bin_names: result })
    } catch (error) {
        console.error("Error fetching bins:", error);
        res.status(500).json({
            error: "server error",
            msg: "Could not retrieve bins at this time."
        })
    }
})

// deletes a bin
app.delete('/api/bins/:binName', async (req: Request, res: Response) => {
    try {
        const binName = req.params.binName as string;
        const pgRequests = await postgresGetAllRequests(binName);
        const mongoIDs = pgRequests.map((request) => request.mongodb_id);

        await mongoDeleteRequestsFromBin(mongoIDs)
        await postgresDeleteBin(binName)
        res.status(204).send()
    } catch (error) {
        console.error("Error deleting bin:", error);
        res.status(500).json({
            error: "server error",
            msg: "Could not delete bin at this time."
        });

    }
})

//delete requests in a bin
app.delete('/api/bins/:binName/requests', async (req: Request, res: Response) => {
    try {
        const binName = req.params.binName as string;
        const pgRequests = await postgresGetAllRequests(binName);
        const mongoIDs = pgRequests.map((request) => request.mongodb_id);

        await mongoDeleteRequestsFromBin(mongoIDs)
        await postgresDeleteAllRequestsFromBin(binName)
        res.status(204).send()
    } catch (error) {
        console.error("Error deleting requests:", error);
        res.status(500).json({
            error: "server error",
            msg: "Could not delete requests at this time."
        });

    }
});

// get all requests for a given bin
app.get('/api/bins/:binName/requests', async (req: Request, res: Response) => {
    try {
        const binName = req.params.binName as string;
        // pull out all requests by bin name
        const pgRequests = await postgresGetAllRequests(binName);

        // pull out all mongo ids inside to get a list of ids
        const mongoIDs = pgRequests.map((request) => request.mongodb_id);

        // use array of mongo ids as argument for mongo query
        const mongoRequests = await mongoFindAllRequestById(mongoIDs);

        // what is the shape of the json
        const mongoMap = new Map(
          mongoRequests.map((doc: any) => [doc._id.toString(), doc])
        );


        // 5. Merge and shape the final response
        const finalResult = pgRequests.map(row => {
            const mongoDoc = mongoMap.get(row.mongodb_id);

            return {
                id: row.id,
                bin_name: row.bin_name,
                time_of_day: row.time_stamp.toTimeString().split(" ")[0],        // "HH:MM:SS"
                date_stamp: row.time_stamp.toLocaleDateString("en-GB").replace(/\//g, ":"), // "DD:MM:YYYY"
                http_method: row.http_method,
                body: mongoDoc?.request?.body ?? {},
                headers: mongoDoc?.request?.headers ?? {},
                path: mongoDoc?.request?.path ?? {},
                query_params: mongoDoc?.request?.query_params ?? {},
            };
        });
        res.status(200).json(finalResult);
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({
            error: "server error",
            msg: "Could not retrieve requests at this time."
        })
    }
})

app.delete('/api/bins/:binName/requests/:requestId', async (req: Request, res: Response) => {
    try {
        const binName = req.params.binName as string;
        const requestId = Number(req.params.requestId)

        const mongodb_id = await postgresDeleteRequest(requestId, binName);
        await mongoDeleteRequest(mongodb_id);

        res.status(204).send()
    } catch (error) {
        console.error("Error deleting request:", error);
        res.status(400).json({
            error: "server error",
            msg: "Could not delete request at this time."
        })
    }
})

/// webhook endpoint
app.use('/bins/:binName', async (req: Request, res: Response) => {
    try {
        const mongoData = {

            headers: req.headers,
            body: req.body,
            path: req.originalUrl,
            query_params: req.query

        };

        const binName = req.params.binName as string;

        const mongoResult = await insertIntoMongo(mongoData)
        const mongodbID = mongoResult.insertedId.toString();
        if (!mongodbID) {
            throw new Error("MongoDB insert failed, no insertedID returned");
        }
        if (!binName) {
            throw new Error("Bin name is missing in the request parameters");
        }
        const pgRow = await postgresInsertRequest(binName, mongodbID, req.method)

        broadcastToBin(binName, {


            id: pgRow.id,
            bin_name: pgRow.bin_name,
            time_of_day: pgRow.time_stamp.toTimeString().split(" ")[0],        // "HH:MM:SS"
            date_stamp: pgRow.time_stamp.toLocaleDateString("en-GB").replace(/\//g, ":"), // "DD:MM:YYYY"
            http_method: pgRow.http_method,
            body: mongoData.body ?? {},
            headers: mongoData?.headers ?? {},
            path: mongoData?.path ?? {},
            query_params: mongoData?.query_params ?? {},


        });
        res.status(202).send();
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({
            error: "server error",
            msg: "Could not record request at this time."
        })
    }
});


const startServer = async () => {
    const PORT = 3000;
    await mongoDBConnect();
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })


}

void startServer();
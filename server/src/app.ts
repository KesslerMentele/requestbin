import express, { Request, Response } from 'express';
import {getPostgresPool, initPostgres} from "./utils/pgConnection"
import { createServer } from 'http';
import cors from 'cors';
import createBinRouter from "./routes/binRoutes";
import createWebhookHandler from "./handlers/webhookHandler";
import {createWebSocketServer} from "./handlers/websocketHandler";
import {initMongo} from "./utils/mongoConnection";
import {createPgService} from "./services/pgService";

const startServer = async () => {
    await Promise.all([
        initMongo(),
        initPostgres()
    ]);
    const pool = getPostgresPool();
    const pgService = createPgService(pool);


    const app = express();

    app.use(cors({ origin: true }));
    app.use(express.json());

    const server = createServer(app);

    createWebSocketServer(server);


    // Health Check
    app.get('/', (_req: Request, res: Response) => {
        res.send("Hello World!")
    })

    // Bin Endpoints
    app.use('/api/bins', createBinRouter(pgService))

    /// Webhook Endpoints
    app.use('/bins/:binName', createWebhookHandler(pgService));


    const PORT = 3000;

    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })


}

void startServer();
import express, { Request, Response } from 'express';
import { initPostgres } from "./utils/pgConnection"
import { createServer } from 'http';
import cors from 'cors';
import binRouter from "./routes/binRoutes";
import {webhookHandler} from "./handlers/webhookHandler";
import {createWebSocketServer} from "./handlers/websocketHandler";
import {initMongo} from "./utils/mongoConnection";

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
app.use('/api/bins', binRouter)

/// Webhook Endpoints
app.use('/bins/:binName', webhookHandler);


const startServer = async () => {
    const PORT = 3000;
    await Promise.all([
        initMongo(),
        initPostgres()
    ]);
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })


}

void startServer();
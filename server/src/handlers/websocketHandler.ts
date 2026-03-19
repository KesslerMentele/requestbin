import {FormattedRequest} from "../types";
import {WebSocket, WebSocketServer} from "ws";
import {IncomingMessage, Server, ServerResponse} from "node:http";


const binSubscribers = new Map<string, Set<WebSocket>>();

export const createWebSocketServer = (
  server:  Server<typeof IncomingMessage, typeof ServerResponse>
) => {

  const wss = new WebSocketServer({ server, path: '/ws' })

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
        //ensures add is not null or undefined with!
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
}



export const broadcastToBin = (binName: string, data: FormattedRequest) => {
  const subscribers = binSubscribers.get(binName)
  if (!subscribers) return;
  const payload = JSON.stringify(data);
  subscribers.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  });
}
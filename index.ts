import { createServer } from "http";
import { Server, Socket } from "socket.io";
import redis from "./lib/redis";
import {MEETING, ONLINE_USERS, USERNAME} from "./constants/redis_keys";
import {events} from "./constants/events";
import * as fs from "fs";
import {createWorker} from "mediasoup";
import Room from "./entities/room";
import {Worker} from "mediasoup/lib/Worker";
import Peer from "./entities/peer";
import {DtlsParameters} from "mediasoup/lib/WebRtcTransport";
import {MediaKind, RtpCapabilities, RtpParameters} from "mediasoup/lib/RtpParameters";

let rooms: Map<string, Room> = new Map<string, Room>();
let worker: Worker;

const STATIC_PATH = __dirname + 'app/build';
const httpServer = createServer(
    function (req, res) {
    fs.readFile(STATIC_PATH + req.url, function (err,data) {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
});
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

io.on("connection", async (socket: Socket) => {
    socket.on('disconnecting', async () => {
        const { rooms } = socket;
        rooms.forEach( async room => {
            await redis.srem(MEETING(room), socket.id);
        })
        await redis.srem(ONLINE_USERS, socket.id);
    });
    socket.on(events.REQUEST_JOIN, async (meeting_id: string, name: string, callback: (data) => any) => {
        let room = await rooms.get(meeting_id);
        if (!room) {
            room = await Room.create(meeting_id, worker, io);
            rooms.set(meeting_id, room);
        }
        room.addPeer(new Peer(socket.id, name));
        await redis.set(USERNAME(socket.id), name);
        await redis.sadd(MEETING(meeting_id), socket.id);
        socket.join(meeting_id);
        callback(room.id);
    });
    socket.on(events.GET_ROUTER_CAPABILITIES, async (meeting_id: string, callback: (data: any) => any) => {
        const room = rooms.get(meeting_id);
        if (room) {
            callback(room.getRtpCapabilities());
        } else {
            callback({
                error: true,
            });
        }
    });

    socket.on(events.GET_PRODUCERS, (meeting_id: string, callback: (data) => any) => {
        const producers = rooms.get(meeting_id).getProducerListForPeer();
        callback(producers);
    });

    socket.on(events.CREATE_WEBRTC_TRANSPORT, async (meeting_id: string, callback: (data) => any) => {
        const { params } = await rooms.get(meeting_id).createWebTransport(socket.id);
        callback(params);
    });

    socket.on(events.CONNECT_TRANSPORT, async (meeting_id: string, transport_id: string, dtlsParameters: DtlsParameters, callback: (data) => any) => {
        await rooms.get(meeting_id).connectPeerTransport(socket.id, transport_id, dtlsParameters);
        callback(true);
    });

    socket.on(events.PRODUCE, async (meeting_id: string, kind: MediaKind, rtpParameters: RtpParameters, producer_transport_id: string, callback: (data) => any) => {
        const producer_id = await rooms.get(meeting_id).produce(socket.id, producer_transport_id, rtpParameters, kind);
        callback(producer_id);
    });

    socket.on(events.CONSUME, async (meeting_id: string, consumer_transport_id: string, producer_id: string, rtpCapabilities: RtpCapabilities, callback: (data) => any) => {
        const params = await rooms.get(meeting_id).consume(socket.id, consumer_transport_id, producer_id, rtpCapabilities);
        callback(params);
    });

    socket.on(events.CLOSE_PRODUCER, async (meeting_id: string, producer_id: string) => {
        rooms.get(meeting_id).closeProducer(socket.id, producer_id);
    });

    socket.on(events.LEAVE_MEETING, async (meeting_id: string) => {
        await redis.srem(MEETING(meeting_id), socket.id);
        socket.leave(meeting_id);
        const room = await rooms.get(meeting_id);
        await room.removePeer(socket.id);
        if (room.getPeers().size === 0) {
            rooms.delete(meeting_id);
        }
    });

    socket.on(events.SEND_MESSAGE, async (meeting_id: string, message: string) => {
        const username = await redis.get(USERNAME(socket.id));
        socket.to(meeting_id).emit(events.MEETING_CHAT, { name: username, message });
    });
    socket.on(events.GET_PARTICIPANTS, async (meeting_id: string, callback: (data) => any) => {
        const members = await redis.smembers(MEETING(meeting_id));
        const promises = members.map<any>(
            async (member) => {
                const name = await redis.get(USERNAME(member));
                return {
                    name,
                    socketId: member
                }
            }
        );
        const result = await Promise.all(promises);
        callback(result);
    })
    await redis.sadd(ONLINE_USERS, socket.id);
});

io.of("/").adapter.on("join-room", async (room, socketId) => {
    const name = await redis.get(USERNAME(socketId));
    io.to(room).emit(events.NEW_PARTICIPANT, {
        name,
        socketId: socketId
    });
});

io.of("/").adapter.on("leave-room", (room, socketId) => {
    io.to(room).emit(events.PARTICIPANT_OFFLINE, socketId);
});

const port = process.env.PORT || 3000;
httpServer.listen(port, async () => {
    worker = await createWorker({ logLevel: "debug" });
    console.log(`Server is listening at ${port}`);
});

import { createServer } from "http";
import { Server, Socket } from "socket.io";
import redis from "./lib/redis";
import {MEETING, ONLINE_USERS, USERNAME} from "./constants/redis_keys";
import {events} from "./constants/events";
import * as fs from "fs";

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
    // socket.on(SET_USERNAME, async (name: string) => {
    //     await redis.set(USERNAME(socket.id), name);
    // });
    socket.on(events.REQUEST_JOIN, async (meeting_id: string, name: string) => {
        await redis.set(USERNAME(socket.id), name);
        await redis.sadd(MEETING(meeting_id), socket.id);
        socket.join(meeting_id);
        socket.emit(events.JOIN_MEETING, meeting_id);
    });
    socket.on(events.LEAVE_MEETING, async (meeting_id: string) => {
        await redis.srem(MEETING(meeting_id), socket.id);
        socket.leave(meeting_id);
    });
    socket.on(events.SEND_MESSAGE, async (meeting_id: string, message: string) => {
        const username = await redis.get(USERNAME(socket.id));
        socket.to(meeting_id).emit(events.MEETING_CHAT, { name: username, message });
    });
    socket.on(events.GET_PARTICIPANTS, async (meeting_id: string) => {
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
        socket.emit(events.GET_PARTICIPANTS, result);
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
httpServer.listen(port, () => console.log(`Server is listening at ${port}`));

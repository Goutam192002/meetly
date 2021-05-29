import {Worker} from "mediasoup/lib/Worker";
import {Server} from "socket.io";
import {Router} from "mediasoup/lib/Router";
import Peer from "./peer";
import {DtlsParameters} from "mediasoup/lib/WebRtcTransport";
import {MediaKind, RtpCapabilities, RtpParameters} from "mediasoup/lib/RtpParameters";
import {events} from "../constants/events";

class Room {
    readonly id: string;
    readonly router: Router;
    readonly peers: Map<string, Peer>;
    readonly io: Server;

    static async create(roomId: string, worker: Worker, io: Server) {
        const router = await worker.createRouter({
            mediaCodecs: [
                {
                    kind: 'audio',
                    mimeType: 'audio/opus',
                    clockRate: 48000,
                    channels: 2
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP8',
                    clockRate: 90000,
                    parameters:
                        {
                            'x-google-start-bitrate': 1000
                        }
                },
            ]
        });
        return new Room(roomId, router, io);
    }

    constructor(roomId: string, router: Router, io: Server) {
        this.id = roomId;
        this.router = router;
        this.io = io;
        this.peers = new Map<string, Peer>();
    }

    addPeer(peer: Peer) {
        this.peers.set(peer.id, peer);
    }

    getProducerListForPeer() {
        const producers = {};
        this.peers.forEach( peer => {
            producers[peer.id] = [];
            peer.producers.forEach(producer => {
                producers[peer.id].push({
                    producer_id: producer.id
                });
            });
        });
        return producers;
    }

    getRtpCapabilities() {
        return this.router.rtpCapabilities;
    }

    async createWebTransport(socketId: string) {
        const transport = await this.router.createWebRtcTransport({
            listenIps: [{
                ip: '0.0.0.0',
                announcedIp: '127.0.0.1'
            }],
            enableUdp: true,
            enableTcp: true,
            preferTcp: true,
            initialAvailableOutgoingBitrate: 1000000
        });
        await transport.setMaxIncomingBitrate(1500000);
        this.peers.get(socketId).addTransport(transport);
        return {
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
            }
        };
    }

    async connectPeerTransport(socketId: string, transportId: string, dtlsParameters: DtlsParameters) {
        const peer = this.peers.get(socketId);
        if (!peer) return;
        await peer.connectTransport(transportId, dtlsParameters);
    }

    async produce(socketId: string, producerTransportId: string, rtpParameters: RtpParameters, kind: MediaKind) {
        const producer = await this.peers.get(socketId).createProducer(producerTransportId, rtpParameters, kind);

        this.broadCast(socketId, events.NEW_PRODUCER, {
            producer_id: producer.id,
            socket_id: socketId
        })
        return producer.id;
    }

    async consume(socketId: string, consumerTransportId: string, producerId: string, rtpCapabilities: RtpCapabilities) {
        if (!this.router.canConsume({ producerId: producerId, rtpCapabilities })) return;
        const { consumer, params } = await this.peers.get(socketId).createConsumer(consumerTransportId, producerId, rtpCapabilities);

        consumer.on('producerclose', () => {
            this.peers.get(socketId).removeConsumer(consumer.id);
            this.io.to(socketId).emit(events.CONSUMER_CLOSED, {
                consumer_id: consumer.id
            });
        });

        return params;
    }

    async removePeer(socketId: string) {
        this.peers.get(socketId).close()
        this.peers.delete(socketId)
    }

    closeProducer(socketId: string, producerId: string) {
        this.peers.get(socketId).closeProducer(producerId);
    }

    broadCast(socketId: string, event: events, data: any) {
        for (const socket of Array.from(this.peers.keys()).filter(id => id !== socketId)) {
            this.io.to(socketId).emit(event, data);
        }
    }

    getPeers() {
        return this.peers;
    }
}

export default Room;
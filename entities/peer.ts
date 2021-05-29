import {DtlsParameters, WebRtcTransport} from "mediasoup/lib/WebRtcTransport";
import {Consumer} from "mediasoup/lib/Consumer";
import {Producer} from "mediasoup/lib/Producer";
import {MediaKind, RtpCapabilities, RtpParameters} from "mediasoup/lib/RtpParameters";

class Peer {
    readonly id;
    readonly name;
    readonly transports: Map<string, WebRtcTransport>;
    readonly consumers: Map<string, Consumer>;
    readonly producers: Map<string, Producer>;

    constructor(socketId: string, name: string) {
        this.id = socketId;
        this.name = name;
        this.transports = new Map<string, WebRtcTransport>();
        this.consumers = new Map<string, Consumer>();
        this.producers = new Map<string, Producer>();
    }

    addTransport(transport: WebRtcTransport) {
        this.transports.set(transport.id, transport);
    }

    async connectTransport(transportId: string, dtlsParameters: DtlsParameters) {
        const transport = this.transports.get(transportId);
        if (!transport) return;
        await transport.connect({ dtlsParameters: dtlsParameters });
    }

    async createProducer(producerTransportId: string, rtpParameters: RtpParameters, kind: MediaKind) {
        const producer = await this.transports.get(producerTransportId).produce({
            kind: kind,
            rtpParameters: rtpParameters
        });

        this.producers.set(producer.id, producer);

        producer.on('transportclose', () => {
            producer.close();
            this.producers.delete(producer.id);
        });

        return producer;
    }

    async createConsumer(consumerTransportId: string, producerId: string, rtpCapabilities: RtpCapabilities) {
        const consumerTransport = this.transports.get(consumerTransportId);
        const consumer = await consumerTransport.consume({
            producerId: producerId,
            rtpCapabilities: rtpCapabilities,
            paused: false
        });

        this.consumers.set(consumer.id, consumer);

        consumer.on('transportclose', () => {
            consumer.close();
            this.consumers.delete(consumer.id);
        });

        return {
            consumer,
            params: {
                producerId: producerId,
                id: consumer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                type: consumer.type,
                producerPaused: consumer.producerPaused
            }
        };
    }

    closeProducer(producerId: string) {
        this.producers.get(producerId).close();
        this.producers.delete(producerId);
    }

    getProducer(producerId: string) {
        return this.producers.get(producerId);
    }

    close() {
        this.transports.forEach(transport => transport.close())
    }

    removeConsumer(consumerId: string) {
        this.consumers.delete(consumerId);
    }
}

export default Peer;
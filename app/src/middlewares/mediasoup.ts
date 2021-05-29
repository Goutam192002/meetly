import {Socket} from "socket.io-client";
import {Device} from "mediasoup-client";
import {events} from "../constants/events";
import {RtpCapabilities} from "mediasoup-client/lib/RtpParameters";
import {Transport, TransportOptions} from "mediasoup-client/lib/Transport";
import {addStream} from "../slices/meeting";

let sendTransport: Transport;
let receiveTransport: Transport;

const mediasoup = (socket: Socket, device: Device) => (store: any) => (next: any) => async (action: any) => {
    if (action.type === 'meeting/joinMeeting') {
        const meetingId = store.getState().meeting.id;
        socket.emit(events.GET_ROUTER_CAPABILITIES, meetingId, async (routerRtpCapabilities: RtpCapabilities) => {
            await device.load({ routerRtpCapabilities });
            socket.emit(events.CREATE_WEBRTC_TRANSPORT, meetingId, async (params: TransportOptions) => {
                sendTransport = await device.createSendTransport(params);

                sendTransport.on('connect', async ({ dtlsParameters }, callback, err) => {
                    socket.emit(events.CONNECT_TRANSPORT, meetingId, sendTransport.id, dtlsParameters, () => {
                        callback();
                    });
                });

                sendTransport.on("produce", async ({ kind, rtpParameters, appData }, callback, err) => {
                   socket.emit(events.PRODUCE, meetingId, kind, rtpParameters, sendTransport.id, (producerId: string) => {
                       callback(producerId);
                   })
                });
            });

            socket.emit(events.CREATE_WEBRTC_TRANSPORT, meetingId, async (params: TransportOptions) => {
                receiveTransport = await device.createRecvTransport(params);

                receiveTransport.on('connect', async ({dtlsParameters}, callback, err) => {
                    socket.emit(events.CONNECT_TRANSPORT, meetingId, receiveTransport.id, dtlsParameters, callback);
                });

                socket.emit(events.GET_PRODUCERS, meetingId, (streams: any) => {
                    for (let participant in streams) {
                        if (streams.hasOwnProperty(participant)) {
                            let producers = streams[participant];
                            if (producers.length === 0) {
                                store.dispatch(addStream({ participant, stream: null }));
                            }
                            producers.forEach( (producer: any) => {
                                socket.emit(events.CONSUME, meetingId, receiveTransport.id, producer.producer_id, device.rtpCapabilities, async ({ id, kind, rtpParameters}: any) => {
                                    const consumer = await receiveTransport.consume({
                                        id,
                                        producerId: producer.producer_id,
                                        kind,
                                        rtpParameters,
                                    });
                                    const stream: MediaStream = new MediaStream();
                                    stream.addTrack(consumer.track);
                                    store.dispatch(addStream({ participant, stream }));
                                })
                            })
                        }
                    }
                });
            })

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const producer = await sendTransport.produce({
                track: stream.getVideoTracks()[0],
                codec: device.rtpCapabilities.codecs?.find((codec) => codec.mimeType.toLocaleLowerCase() === 'video/h264'),
                codecOptions : {
                    videoGoogleStartBitrate : 1000
                }
            });
        });
    }
    return next(action);
}

export {mediasoup};
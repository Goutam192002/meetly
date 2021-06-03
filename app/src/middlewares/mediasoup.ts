import {Socket} from "socket.io-client";
import {Device} from "mediasoup-client";
import {events} from "../constants/events";
import {MediaKind, RtpCapabilities} from "mediasoup-client/lib/RtpParameters";
import {Transport, TransportOptions} from "mediasoup-client/lib/Transport";
import {setParticipants} from "../slices/meeting";
import {Participant} from "../interfaces/meeting";
import {Producer} from "mediasoup-client/lib/Producer";
import store from "../store";
import {Consumer} from "mediasoup-client/lib/Consumer";

let sendTransport: Transport;
let receiveTransport: Transport;

let audioProducer: Producer;
let videoProducer: Producer;

const mediasoup = (socket: Socket, device: Device) => (store: any) => (next: any) => async (action: any) => {
    const { audioEnabled, videoEnabled } = store.getState().meeting.self;
    let stream: MediaStream|null;
    if (audioEnabled || videoEnabled) {
        stream = await navigator.mediaDevices.getUserMedia({ video: videoEnabled, audio: audioEnabled});
    }

    switch (action.type) {
        case 'meeting/joinMeeting':
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

                    if (videoEnabled) {
                        videoProducer = await sendTransport.produce({
                            track: stream!!.getVideoTracks()[0],
                            codec: device.rtpCapabilities.codecs?.find((codec) => codec.mimeType.toLocaleLowerCase() === 'video/h264'),
                            codecOptions : {
                                videoGoogleStartBitrate : 1000
                            },
                        });
                    }
                    if (audioEnabled) {
                        audioProducer = await sendTransport.produce({
                            track: stream!!.getAudioTracks()[0],
                            codec: device.rtpCapabilities.codecs?.find((codec) => codec.kind === 'audio')
                        });
                    }
                });

                socket.emit(events.CREATE_WEBRTC_TRANSPORT, meetingId, async (params: TransportOptions) => {
                    receiveTransport = await device.createRecvTransport(params);

                    receiveTransport.on('connect', async ({dtlsParameters}, callback, err) => {
                        socket.emit(events.CONNECT_TRANSPORT, meetingId, receiveTransport.id, dtlsParameters, callback);
                    });

                    socket.emit(events.GET_PARTICIPANTS, meetingId, async (participants: any) => {
                        const state: Participant[] = [];
                        for (let index in participants) {
                            if (participants.hasOwnProperty(index)) {
                                const item: Participant = {
                                    name: participants[index].name,
                                    id: participants[index].id,
                                    stream: null,
                                    audioEnabled: false,
                                    videoEnabled: false,
                                }
                                let participant = participants[index];
                                const stream: MediaStream = new MediaStream();
                                for (const mediaKind of Object.keys(participant.producers)) {
                                    const {paused, track} = await consumeParticipant(socket, meetingId, participant.producers[mediaKind], device.rtpCapabilities) as any;
                                    item.videoEnabled = mediaKind == 'video' ? !paused : item.videoEnabled;
                                    item.audioEnabled = mediaKind == 'audio' ? !paused : item.audioEnabled;
                                    stream.addTrack(track);
                                }
                                item.stream = stream;
                                state.push(item);
                            }
                        }
                        store.dispatch(setParticipants(state));
                    });
                })
            });
            break;
        case 'meeting/newProducer':
            const { producer_id, socket_id } = action.payload;
            const { participants, id } = store.getState().meeting;

            const remoteStream = participants.filter((participant: Participant) => participant.id === socket_id)[0].stream || new MediaStream();

            const { paused, track, kind } = await consumeParticipant(socket, id, producer_id, device.rtpCapabilities) as any;
            if (kind === 'video') {
                action.payload.videoEnabled = !paused;
            } else if (kind === 'audio') {
                action.payload.audioEnabled = !paused;
            }
            remoteStream.addTrack(track);

            action.payload.stream = remoteStream;
            break;
        case 'meeting/muteMic':
            await pauseProducer(audioProducer, socket);
            break;
        case 'meeting/unmuteMic':
            if (!audioProducer) {
                audioProducer = await sendTransport.produce({
                    track: stream!!.getAudioTracks()[0],
                    codec: device.rtpCapabilities.codecs?.find((codec) => codec.kind === 'audio')
                });
            }
            await resumeProducer(audioProducer, socket);
            break;
        case 'meeting/videoOff':
            await pauseProducer(videoProducer, socket);
            break;
        case 'meeting/videoOn':
            if (!videoProducer) {
                videoProducer = await sendTransport.produce({
                    track: stream!!.getVideoTracks()[0],
                    codec: device.rtpCapabilities.codecs?.find((codec) => codec.mimeType.toLocaleLowerCase() === 'video/h264'),
                    codecOptions : {
                        videoGoogleStartBitrate : 1000
                    },
                });
            }
            await resumeProducer(videoProducer, socket);
            break;
        default:
            break;
    }
    return next(action);
}

const pauseProducer = (producer: Producer, socket: Socket) => {
    return new Promise((resolve) => {
        const { id } = store.getState().meeting;
        socket.emit(events.PAUSE_PRODUCER, id, producer.id, () => {
            producer.pause();
            resolve(true);
        });
    })
}

const resumeProducer = (producer: Producer, socket: Socket) => {
    return new Promise(resolve => {
        const { id } = store.getState().meeting;
        socket.emit(events.RESUME_PRODUCER, id, producer.id, () => {
            producer.resume();
            resolve(true);
        });
    });
}

const consumeParticipant = (socket: Socket, meetingId: string, producerId: string, rtpCapabilities: RtpCapabilities) => {
    return new Promise(resolve => {
        socket.emit(events.CONSUME, meetingId, receiveTransport.id, producerId, rtpCapabilities, async ({id, kind, rtpParameters}: any) => {
            const consumer: Consumer = await receiveTransport.consume({
                id,
                producerId: producerId,
                kind,
                rtpParameters,
            });
            resolve({
                paused: consumer.paused,
                track: consumer.track,
                kind: kind,
            })
        });
    });
}

export {mediasoup};

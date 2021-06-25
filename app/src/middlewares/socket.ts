import {Socket} from "socket.io-client";
import {events} from "../constants/events";
import {Dispatch} from "react";
import {
    addParticipant,
    joinMeeting,
    newMessage, newProducer,
    removeParticipant,
    setParticipants,
    resumeConsumer,
    pauseConsumer,
} from '../slices/meeting';
import { show } from "../slices/toast";


const emitEventMiddleWare = (socket: Socket) => (store: any) => (next: any) => (action: any) => {
    const { dispatch } = store;
    switch (action.type) {
        case 'meeting/requestToJoinMeeting':
            socket.emit(events.REQUEST_JOIN, action.payload.meeting_id, action.payload.name, (response: any) => {
                dispatch(joinMeeting(socket.id));
            });
            break;
        case 'meeting/sendMessage':
            socket.emit(events.SEND_MESSAGE, action.payload.meeting_id, action.payload.message);
            break;
        case 'meeting/getParticipants':
            socket.emit(events.GET_PARTICIPANTS, action.payload.meeting_id, (participants: any[]) => {
                dispatch(setParticipants(participants));
            });
            break;
        case 'meeting/leaveMeeting':
            socket.emit(events.LEAVE_MEETING, action.payload.meeting_id);
            break;
        default:
            break;
    }
    return next(action);
}

const listeners = [
    {
        name: events.RESUME_CONSUMER,
        callback: (dispatch: Dispatch<any>, message: any) => {
            dispatch(resumeConsumer(message));
        }
    }, {
        name: events.PAUSE_CONSUMER,
        callback: (dispatch: Dispatch<any>, message: any) => {
            dispatch(pauseConsumer(message));
        }
    }, {
        name: events.NEW_MESSAGE,
        callback: (dispatch: Dispatch<any>, message: any) => {
            dispatch(newMessage(message));
        }
    }, {
        name: events.PARTICIPANT_OFFLINE,
        callback: (dispatch: Dispatch<any>, participantId: string) => {
            dispatch(removeParticipant(participantId));
        }
    }, {
        name: events.NEW_PARTICIPANT,
        callback: (dispatch: Dispatch<any>, participant: any) => {
            dispatch(
                addParticipant({
                    name: participant.name,
                    id: participant.id,
                    stream: null,
                    audioEnabled: false,
                    videoEnabled: false,
                })
            );
            dispatch(show(`${participant.name} has joined the meeting`));
        }
    }, {
        name: events.NEW_PRODUCER,
        callback: (dispatch: Dispatch<any>, data: any) => {
            dispatch(newProducer(data));
        }
    }
];

export { emitEventMiddleWare, listeners };

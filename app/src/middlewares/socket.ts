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

const eventHandler: any = {};

eventHandler[events.NEW_PRODUCER] = (dispatch: Dispatch<any>, data: any) => {
    dispatch(newProducer(data));
}

eventHandler[events.NEW_PARTICIPANT] = (dispatch: Dispatch<any>, participant: any) => {
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

eventHandler[events.PARTICIPANT_OFFLINE] = (dispatch: Dispatch<any>, participantId: string) => {
    dispatch(removeParticipant(participantId));
}

eventHandler[events.NEW_MESSAGE] = (dispatch: Dispatch<any>, message: any) => {
    dispatch(newMessage(message));
}

eventHandler[events.PAUSE_CONSUMER] = (dispatch: Dispatch<any>, message: any) => {
    dispatch(pauseConsumer(message));
}

eventHandler[events.RESUME_CONSUMER] = (dispatch: Dispatch<any>, message: any) => {
    dispatch(resumeConsumer(message));
}

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
        default:
            break;
    }
    return next(action);
}

const subscribeToEventsMiddleWare = (socket: Socket) => ({ dispatch }: any) => (next: any) => (action: any) => {
    Object.values(events).map(event => {
        if (eventHandler[event] && !socket.hasListeners(event)) {
            socket.on(event, (...data: any[]) => {
                eventHandler[event](dispatch, ...data)
            });
        }
    });
    return next(action);
}

export { emitEventMiddleWare, subscribeToEventsMiddleWare };

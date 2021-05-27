import {Socket} from "socket.io-client";
import {events} from "../constants/events";
import {Dispatch} from "react";
import {addParticipant, joinMeeting, newMessage, removeParticipant, setParticipants} from '../slices/meeting';
import {useToasts} from "react-toast-notifications";
import { show } from "../slices/toast";

const eventHandler: any = {};
eventHandler[events.JOIN_MEETING] = (dispatch: Dispatch<any>) => {
    dispatch(joinMeeting())
}

eventHandler[events.GET_PARTICIPANTS] = (dispatch: Dispatch<any>, participants: any[]) => {
    dispatch(setParticipants(participants))
}

eventHandler[events.NEW_PARTICIPANT] = (dispatch: Dispatch<any>, participant: any) => {
    dispatch(addParticipant(participant));
    dispatch(show(`${participant.name} has joined the meeting`));
}

eventHandler[events.PARTICIPANT_OFFLINE] = (dispatch: Dispatch<any>, participantId: string) => {
    dispatch(removeParticipant(participantId));
}

eventHandler[events.NEW_MESSAGE] = (dispatch: Dispatch<any>, message: any) => {
    dispatch(newMessage(message));
}

const emitEventMiddleWare = (socket: Socket) => (store: any) => (next: any) => (action: any) => {
    if (action.payload && action.payload.socket) {
        socket.emit(action.payload.socket.event_name, ...action.payload.socket.args);
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

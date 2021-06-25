import {Socket} from "socket.io-client";
import {Dispatch} from "react";
import {events} from "../constants/events";

export const attachListeners = (
    listeners: { name: events; callback: (dispatch: Dispatch<any>, data: any) => void; }[],
    socket: Socket,
    { dispatch }: { dispatch: Dispatch<any> }
    ) => {
    listeners.forEach(listener => {
        socket.on(listener.name, (...data: any[]) => {
            listener.callback(dispatch, data);
        });
    });
};

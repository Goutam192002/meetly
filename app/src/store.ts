import {configureStore, getDefaultMiddleware} from '@reduxjs/toolkit'
import { default as MeetingReducer } from './slices/meeting';
import { default as ToastReducer } from './slices/toast';

import {io} from "socket.io-client";
import {emitEventMiddleWare, listeners} from "./middlewares/socket";
import {Device} from "mediasoup-client";
import {mediasoup} from "./middlewares/mediasoup";
import {enableMapSet} from "immer";
import {attachListeners} from "./utils/helpers";
import {UserMediaReducer} from "./slices/userMedia";

enableMapSet();

const address = process.env.SOCKET_ADDRESS || "http://localhost:3000"
const socket = io(address);
const device = new Device();

const reducer = {
    meeting: MeetingReducer,
    toast: ToastReducer,
    userMedia: UserMediaReducer,
}

const store = configureStore({
    reducer: reducer,
    middleware: [emitEventMiddleWare(socket), mediasoup(socket, device), ...getDefaultMiddleware({
        serializableCheck: false
    })]
});

// Adds event listeners to socket
attachListeners(listeners, socket, store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store;

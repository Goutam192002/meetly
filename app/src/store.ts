import {configureStore, getDefaultMiddleware} from '@reduxjs/toolkit'
import { default as MeetingReducer } from './slices/meeting';
import { default as ToastReducer } from './slices/toast';

import {io} from "socket.io-client";
import {emitEventMiddleWare, subscribeToEventsMiddleWare} from "./middlewares/socket";

const socket = io("http://localhost:8000/")

const reducer = {
    meeting: MeetingReducer,
    toast: ToastReducer
}

const store = configureStore({
    reducer: reducer,
    middleware: [emitEventMiddleWare(socket), subscribeToEventsMiddleWare(socket), ...getDefaultMiddleware()]
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store;
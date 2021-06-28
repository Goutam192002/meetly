import {createSlice} from "@reduxjs/toolkit";
import {fetchMediaDevices, fetchMediaStream} from "../utils/userMedia";

const initialState = {
    status: 'idle',
    devices: {
        "audioinput": [] as any[],
        "videoinput": [] as any[],
        "audiooutput": [] as any[],
    },
    stream: new MediaStream(),
    streamStatus: {
        audioEnabled: false,
        videoEnabled: false
    }
};

const userMediaSlice = createSlice({
    name: 'userMedia',
    initialState,
    reducers: {
        toggleAudio(state) {
            state.streamStatus.audioEnabled = !state.streamStatus.audioEnabled;
            state.stream.getAudioTracks().forEach(track => track.enabled = state.streamStatus.audioEnabled);
        },

        toggleVideo(state) {
            state.streamStatus.videoEnabled = !state.streamStatus.videoEnabled;
            state.stream.getVideoTracks().forEach(track => track.enabled = state.streamStatus.videoEnabled);
        }
    },
    extraReducers: builder => {
        builder.addCase(fetchMediaDevices.pending, (state, action) => {
            state.status = 'pending';
        });

        builder.addCase(fetchMediaDevices.fulfilled, (state, action) => {
            state.devices = action.payload;
            state.status = 'fulfilled';
        });

        builder.addCase(fetchMediaStream.fulfilled, (state, action) => {
            state.stream = action.payload;
            state.streamStatus.audioEnabled = state.stream.getAudioTracks().length > 0;
            state.streamStatus.videoEnabled = state.stream.getVideoTracks().length > 0;
        })
    }
});

export const UserMediaReducer = userMediaSlice.reducer;
export const { toggleAudio, toggleVideo } = userMediaSlice.actions;

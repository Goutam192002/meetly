import {createAsyncThunk} from "@reduxjs/toolkit";

const fetchMediaDevices = createAsyncThunk('client/fetchMediaDevices', async () => {
   const devices = await navigator.mediaDevices.enumerateDevices();
   const result = {
       "audioinput": [],
       "audiooutput": [],
       "videoinput": []
   };
   devices.forEach(device => {
       result[device.kind].push(device);
   });
   return result;
});

const fetchMediaStream = createAsyncThunk('client/fetchMediaStream', async ({ videoDeviceId, audioDeviceId }) => {
    return await navigator.mediaDevices.getUserMedia({
        video: {
            deviceId: videoDeviceId,
        },
        audio: {
            deviceId: audioDeviceId,
        },
    });
});

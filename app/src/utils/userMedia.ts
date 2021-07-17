import {createAsyncThunk} from "@reduxjs/toolkit";

const fetchMediaDevices = createAsyncThunk('userMedia/fetchMediaDevices', async () => {
   const devices = await navigator.mediaDevices.enumerateDevices();
   const result = {
       "audioinput": [],
       "audiooutput": [],
       "videoinput": []
   } as any;
   devices.forEach(device => {
       result[device.kind].push(device);
   });
   return result as any;
});

const fetchMediaStream = createAsyncThunk('userMedia/fetchMediaStream', async (options: any) => {
    return (await navigator.mediaDevices.getUserMedia({
        video: {
            deviceId: options?.video?.deviceId,
        },
        audio: {
            deviceId: options?.audio?.deviceId,
        },
    })) as MediaStream;
});

export { fetchMediaDevices, fetchMediaStream };

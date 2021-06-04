import {Action, createSlice, PayloadAction} from "@reduxjs/toolkit";
import Meeting, {EmptyMeeting, MeetingStatus} from "../interfaces/meeting";

const initialState: Meeting = EmptyMeeting

const meetingSlice = createSlice({
    name: 'meeting',
    initialState,
    reducers: {
        requestToJoinMeeting(state: Meeting, action: PayloadAction<any>) {
            state.status = MeetingStatus.REQUEST_TO_JOIN;
            state.id = action.payload.meeting_id;
            state.self.videoEnabled = action.payload.video;
            state.self.audioEnabled = action.payload.audio;
        },

        joinMeeting(state: Meeting, action: PayloadAction<string>) {
            state.self.id = action.payload;
            state.status = MeetingStatus.IN_MEETING;
        },

        leaveMeeting(state, action) {
            state = EmptyMeeting;
        },

        getParticipants(state, action) {},

        setParticipants(state, action) {
            state.participants = action.payload;
        },

        addParticipant(state, action) {
            state.participants.push(action.payload);
        },

        removeParticipant(state, action) {
            state.participants = state.participants.filter(participant => participant.id !== action.payload);
        },

        sendMessage(state, action) {
            state.messages.push({
                name: 'You',
                message: action.payload.message
            });
        },

        newMessage(state, action) {
            state.messages.push(action.payload);
        },

        produce(state, action) {},

        newProducer(state, action) {
            const { stream, socket_id, audioEnabled, videoEnabled } = action.payload;
            for (const idx in state.participants) {
                if (state.participants[idx].id === socket_id) {
                    state.participants[idx].audioEnabled = audioEnabled || state.participants[idx].audioEnabled;
                    state.participants[idx].videoEnabled = videoEnabled || state.participants[idx].videoEnabled;
                    state.participants[idx].stream = stream;
                    break;
                }
            }
        },

        muteMic(state, action: Action) {
            state.self.audioEnabled = false
        },

        unmuteMic(state, action: Action) {
            state.self.audioEnabled = true
        },

        videoOff(state, action: Action) {
            state.self.videoEnabled = false
        },

        videoOn(state, action: Action) {
            state.self.videoEnabled = true
        }
    }
});

export const {
    joinMeeting,
    leaveMeeting,
    produce,
    requestToJoinMeeting,
    getParticipants,
    setParticipants,
    addParticipant,
    removeParticipant,
    newMessage,
    sendMessage,
    newProducer,
    muteMic,
    unmuteMic,
    videoOff,
    videoOn
} = meetingSlice.actions;
export default meetingSlice.reducer;


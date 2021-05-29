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
        },

        joinMeeting(state: Meeting, action: Action) {
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
            state.participants = state.participants.filter(participant => participant.socketId !== action.payload);
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

        addStream(state, action) {
            state.streams.push(action.payload);
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
    addStream,
} = meetingSlice.actions;
export default meetingSlice.reducer;


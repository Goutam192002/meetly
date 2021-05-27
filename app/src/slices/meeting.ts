import {Action, createSlice, PayloadAction} from "@reduxjs/toolkit";
import Meeting, {EmptyMeeting, JoinMeetingPayload, MeetingStatus, SocketPayload} from "../interfaces/meeting";

const initialState: Meeting = EmptyMeeting

const meetingSlice = createSlice({
    name: 'meeting',
    initialState,
    reducers: {
        requestToJoinMeeting(state: Meeting, action: PayloadAction<SocketPayload<JoinMeetingPayload>>) {
            state.status = MeetingStatus.REQUEST_TO_JOIN;
            state.id = action.payload.socket.args[0];
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
                message: action.payload.socket.args[1]
            });
        },

        newMessage(state, action) {
            state.messages.push(action.payload);
        }
    }
});

export const {
    joinMeeting,
    leaveMeeting,
    requestToJoinMeeting,
    getParticipants,
    setParticipants,
    addParticipant,
    removeParticipant,
    newMessage,
    sendMessage
} = meetingSlice.actions;
export default meetingSlice.reducer;


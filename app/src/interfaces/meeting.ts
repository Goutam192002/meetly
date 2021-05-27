import {events} from "../constants/events";

export enum MeetingStatus {
    NONE='',
    REQUEST_TO_JOIN = 'request_to_join',
    IN_MEETING = 'in_meeting',
    FAILED = 'failed'
}

export const EmptyMeeting: Meeting = {
    status: MeetingStatus.NONE,
    id: '',
    participants: [],
    messages: []
}

export default interface Meeting {
    status: MeetingStatus;
    id: string;
    participants: any[];
    messages: any[];
}

export interface JoinMeetingPayload {
    event_name: events;
    args: any[];
}

export interface SocketPayload<T> {
    socket: T;
}

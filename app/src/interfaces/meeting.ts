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
    messages: [],
    streams: new Map<string, MediaStream[]>(),
}

export default interface Meeting {
    status: MeetingStatus;
    id: string;
    participants: any[];
    messages: any[];
    streams: Map<string, MediaStream[]>;
}
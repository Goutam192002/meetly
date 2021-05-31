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
}

export default interface Meeting {
    status: MeetingStatus;
    id: string;
    participants: Participant[];
    messages: any[];
}

export interface Participant {
    name: string;
    id: string;
    stream: MediaStream|null
}
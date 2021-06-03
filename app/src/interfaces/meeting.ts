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
    self: {
        audioEnabled: false,
        videoEnabled: false
    }
}

export default interface Meeting {
    self: SelfStatus;
    status: MeetingStatus;
    id: string;
    participants: Participant[];
    messages: any[];
}

interface SelfStatus {
    audioEnabled: boolean;
    videoEnabled: boolean;
}

export interface Participant {
    name: string;
    id: string;
    stream: MediaStream|null;
    audioEnabled?: boolean;
    videoEnabled?: boolean;
}

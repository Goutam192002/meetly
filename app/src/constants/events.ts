enum events {
    SET_USERNAME = 'users:set_name',
    JOIN_MEETING = 'meeting:join',
    LEAVE_MEETING = 'meeting:leave',
    REQUEST_JOIN = 'meeting:request_join',
    SEND_MESSAGE = 'meeting:send_message',
    NEW_MESSAGE = 'meeting:chat',
    GET_PARTICIPANTS = 'meeting:iq:participants',
    NEW_PARTICIPANT = 'meeting:participants:new',
    PARTICIPANT_OFFLINE = 'meeting:participants:offline'
}

export {events}

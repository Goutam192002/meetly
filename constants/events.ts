enum events {
    SET_USERNAME = 'users:set_name',
    JOIN_MEETING = 'meeting:join',
    LEAVE_MEETING = 'meeting:leave',
    REQUEST_JOIN = 'meeting:request_join',
    SEND_MESSAGE = 'meeting:send_message',
    MEETING_CHAT = 'meeting:chat',
    GET_PARTICIPANTS = 'meeting:iq:participants',
    NEW_PARTICIPANT = 'meeting:participants:new',
    PARTICIPANT_OFFLINE = 'meeting:participants:offline',
    GET_ROUTER_CAPABILITIES = 'router:capabilities',
    CONSUMER_CLOSED = 'consumer:closed',
    NEW_PRODUCER = 'producers:new',
    GET_PRODUCERS = 'producers:get',
    CREATE_WEBRTC_TRANSPORT = 'transports:create:webrtc',
    CONNECT_TRANSPORT = 'transports:connect',
    PRODUCE = 'transports:produce',
    CONSUME = 'transports:consume',
    CLOSE_PRODUCER = 'transports:producer:close'
}

export {events}

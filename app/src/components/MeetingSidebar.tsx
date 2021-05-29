import React, {ChangeEvent, useState} from "react";
import {RootState} from "../store";
import {useDispatch, useSelector} from "react-redux";
import { show } from "../slices/toast";
import {events} from "../constants/events";
import { sendMessage } from "../slices/meeting";

const getParticipants = (state: RootState) => state.meeting.participants;
const getMeetingId = (state: RootState) => state.meeting.id;
const getMessages = (state: RootState) => state.meeting.messages;

const MeetingSidebar = ({isMobile, isOpen, toggleSidebar, tab='participants'}: {isMobile: boolean, isOpen: boolean, toggleSidebar: (arg: boolean) => void, tab?: string}) => {
    const [activeTab, setActiveTab] = useState(tab);
    const [message, setMessage] = useState('');

    const meetingId = useSelector(getMeetingId);
    const participants = useSelector(getParticipants);
    const messages = useSelector(getMessages);

    const dispatch = useDispatch();

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(window.location.href);
        dispatch(show('Link copied to clipboard.'))
    };

    const onMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
        setMessage(event.currentTarget.value);
    }

    const send = () => {
        if (message) {
            dispatch(
                sendMessage({
                    event_name: events.SEND_MESSAGE,
                    meeting_id: meetingId,
                    message: message
                })
            );
            setMessage('');
        }
    }

    return (
        <nav className={`bg-white ${ isMobile ? "fixed right-0 z-10": ""} h-screen flex flex-col bg-grey-lightest shadow-md w-full sm:w-1/3 lg:w-1/4 ${ isMobile ? isOpen ? "" : "transform translate-x-full" : ""} `}>
            { isMobile && <button className="p-2 ml-auto" onClick={() => toggleSidebar(!isOpen)}><img src="/close.svg" /></button> }
            <button onClick={copyToClipboard} className="p-4 text-green-600 focus:outline-none text-left hover:bg-gray-100">
                <img src="/copy.svg" className="inline-block mr-2" />
                <span className="py-auto font-medium">COPY MEETING LINK</span>
            </button>

            <div className="flex flex-row">
                <button className={`flex-1 p-4 ${activeTab === 'participants' ? 'border-b-2 border-green-600 text-green-600': ''} focus:outline-none`} onClick={() => setActiveTab('participants')}>Participants</button>
                <button className={`flex-1 p-4 ${activeTab === 'chat' ? 'border-b-2 border-green-600 text-green-600': ''} focus:outline-none`} onClick={() => setActiveTab('chat')}>Chat</button>
            </div>
            {
                activeTab === 'participants' && participants.length ? (
                    <div className="flex-1 overflow-y-scroll p-2">
                        {
                            participants.map( participant => <div className="p-4" id={participant.socketId}>{participant.name}</div>)
                        }
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-2">
                        {
                            messages.length ? messages.map(
                                message => (
                                    <div className="p-4">
                                        <p className="font-medium">{message.name}</p>
                                        <p>{message.message}</p>
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-4">
                                    <p>No messages Yet!</p>
                                </div>
                            )
                        }
                    </div>
                )
            }
            {
                activeTab === 'chat' && (
                    <div className="flex flex-row bg-white p-4">
                        <input type="text" placeholder="Enter your message" className="flex-1 flex-shrink focus:outline-none"
                               value={message}
                               onChange={onMessageChange}
                               onKeyDown={(event) => {
                                   if (event.key.toLowerCase() === 'enter') {
                                       send();
                                   }
                               }}
                        />
                        <button onClick={send}><img src="/send.svg" /></button>
                    </div>
                )
            }
        </nav>
    )
}

export default MeetingSidebar;

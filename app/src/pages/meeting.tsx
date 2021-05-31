import React, {useEffect, useState} from "react";
import MeetingSidebar from "../components/MeetingSidebar";
import {RootState} from "../store";
import {useSelector} from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import Video from "../components/Video";
import {Participant} from "../interfaces/meeting";

const getMeeting = (state: RootState) => state.meeting

const Meeting = () => {
    const [isOpen, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const { id } = useParams<{id: string}>();
    const meeting = useSelector(getMeeting);
    const history = useHistory();

    const handleWindowSizeChange = () => setIsMobile(window.innerWidth <= 768);

    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        if (!meeting.id) {
            history.push(`/?mid=${id}`);
        }
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    return (
        <div className="h-screen max-h-screen flex flex-wrap">
            <div className="flex-1 flex flex-col max-h-screen">
                <div className="flex-1 flex flex-row">
                    {
                        meeting.participants.map((participant: Participant) => {
                            return participant.stream && (<Video autoPlay={true} playsInline={true} srcObject={participant.stream} />)
                        })
                    }
                </div>
                <div className="flex flex-row justify-center gap-x-3 py-4 bg-white-400">
                    <button className="bg-white rounded-full shadow-xl p-4 focus:outline-none">
                        <img src="/mic_off.svg"/>
                    </button>
                    <button className="bg-white rounded-full shadow-xl p-4 focus:outline-none">
                        <img src="/videocam_off.svg"/>
                    </button>
                    {
                        isMobile && (
                            <button className="bg-white rounded-full shadow-xl p-4 focus:outline-none" onClick={() => { setOpen(!isOpen) }}>
                                <img src="/chat.svg"/>
                            </button>
                        )
                    }
                    <button className="bg-red-600 rounded-full shadow-xl p-4 focus:outline-none">
                        <img src="/call_end.svg" className="text-white"/>
                    </button>
                </div>
            </div>
            <MeetingSidebar tab="chat" isOpen={isOpen} isMobile={isMobile} toggleSidebar={setOpen} />
        </div>
    )
};

export default Meeting;

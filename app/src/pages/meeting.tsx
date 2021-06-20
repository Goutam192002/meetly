import React, {useEffect, useState} from "react";
import MeetingSidebar from "../components/MeetingSidebar";
import {RootState} from "../store";
import {useSelector} from "react-redux";
import {useHistory, useParams} from "react-router-dom";
import {default as MeetingInterface, MeetingStatus, Participant} from "../interfaces/meeting";
import {leaveMeeting, muteMic, unmuteMic, videoOff, videoOn} from "../slices/meeting";
import {useAppDispatch as useDispatch} from "../hooks";
import ParticipantVideo from "../components/ParticipantVideo";

const getMeeting = (state: RootState) => state.meeting

const Meeting = () => {
    const [isOpen, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [activeIndex, setActiveIndex] = useState(0);
    const { id } = useParams<{id: string}>();
    const meeting: MeetingInterface = useSelector(getMeeting);
    const history = useHistory();
    const dispatch = useDispatch();

    const handleWindowSizeChange = () => setIsMobile(window.innerWidth <= 768);

    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        if (!meeting.id) {
            history.replace(`/?mid=${id}`);
        }
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    const toggleAudio = () => {
        if (meeting.self.audioEnabled) {
            dispatch(muteMic());
        } else {
            dispatch(unmuteMic())
        }
    }

    const toggleVideo = () => {
        if (meeting.self.videoEnabled) {
            dispatch(videoOff());
        } else {
            dispatch(videoOn());
        }
    }

    const setActive = (index: number) => () => { console.log(index); console.log("CLick initiated"); setActiveIndex(index); };

    if (meeting.participants.length > 0) {
        return (
            <div className="h-screen max-h-screen flex flex-wrap max-w-full">
                <div className="flex-1 flex flex-col max-h-full max-w-full">
                    <div className="flex flex-row flex-nowrap overflow-x-auto p-2 gap-2">
                        {
                            meeting.participants.map((participant: Participant, index: number) => {
                                return (
                                    <div onClick={setActive(index)} className={`rounded ${activeIndex === index ? 'border-4 border-green-500': ''}`}>
                                        <ParticipantVideo participant={participant} size="w-20 h-20" forceMute={activeIndex === index} showMuteStatus={false} />
                                    </div>
                                )
                            })
                        }
                    </div>
                    <div className="flex-1 p-2">
                        <ParticipantVideo participant={meeting.participants[activeIndex]} forceMute={meeting.participants[activeIndex].id === meeting.self.id} size="w-full h-full" />
                    </div>
                    <div className="flex flex-row justify-center gap-x-3 py-4 bg-white-400">
                        <button className="bg-white rounded-full shadow-xl p-4 focus:outline-none" onClick={toggleAudio}>
                            {
                                meeting.self.audioEnabled ? (<img src="/mic_on.svg" />) : (<img src="/mic_off.svg"/>)
                            }
                        </button>
                        <button className="bg-white rounded-full shadow-xl p-4 focus:outline-none" onClick={toggleVideo}>
                            {
                                meeting.self.videoEnabled ? (<img src="/video_on.svg" />) : (<img src="/videocam_off.svg"/>)
                            }
                        </button>
                        {
                            isMobile && (
                                <button className="bg-white rounded-full shadow-xl p-4 focus:outline-none" onClick={() => { setOpen(!isOpen) }}>
                                    <img src="/chat.svg"/>
                                </button>
                            )
                        }
                        <button className="bg-red-600 rounded-full shadow-xl p-4 focus:outline-none" onClick={() => dispatch(leaveMeeting({ meeting_id: meeting.id, history: history }))}>
                            <img src="/call_end.svg" className="text-white"/>
                        </button>
                    </div>
                </div>
                <MeetingSidebar tab="chat" isOpen={isOpen} isMobile={isMobile} toggleSidebar={setOpen} />
            </div>
        )
    } else {
        return (<p>Loading</p>);
    }
};

export default Meeting;

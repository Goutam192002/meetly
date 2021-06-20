import React, {useEffect, useState} from "react";
import MeetingSidebar from "../components/MeetingSidebar";
import {RootState} from "../store";
import {useSelector} from "react-redux";
import {useHistory, useParams} from "react-router-dom";
import Video from "../components/Video";
import {default as MeetingInterface, Participant} from "../interfaces/meeting";
import {muteMic, unmuteMic, videoOff, videoOn} from "../slices/meeting";
import {useAppDispatch as useDispatch} from "../hooks";

const getMeeting = (state: RootState) => state.meeting

const Meeting = () => {
    const [isOpen, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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

    return (
        <div className="h-screen max-h-screen flex flex-wrap">
            <div className="flex-1 flex flex-col max-h-full">
                <div className="flex flex-row flex-nowrap">
                    {
                        meeting.participants.map((participant: Participant) => {
                            return participant.id !== meeting.self.id && (
                                participant.videoEnabled ? (
                                    <Video srcObject={participant.stream!!} muted={true} className="inline w-40 h-40"/>
                                ) : (<div className="bg-black inline w-40 h-40" />)
                            )
                        })
                    }
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 grid-rows-1 sm:grid-rows-2 gap-4">
                    {
                        meeting.participants.map((participant: Participant) => {
                            return participant.id !== meeting.self.id && (
                                <div className="relative">
                                    {participant.videoEnabled ? (
                                        <Video className="absolute h-full w-full position-center object-cover" muted={!participant.audioEnabled} autoPlay={true} playsInline={true}
                                               srcObject={participant.stream!!}/>) : (
                                        <div className="absolute w-full h-full bg-black"/>
                                    )}
                                    <div className="absolute w-full h-full">
                                    <span className="absolute left-0 bottom-0 m-2">
                                        {participant.audioEnabled ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 24 24"
                                                 height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF">
                                                <g>
                                                    <rect fill="none" height="24" width="24"/>
                                                    <rect fill="none" height="24" width="24"/>
                                                    <rect fill="none" height="24" width="24"/>
                                                </g>
                                                <g>
                                                    <g/>
                                                    <g>
                                                        <path
                                                            d="M12,14c1.66,0,3-1.34,3-3V5c0-1.66-1.34-3-3-3S9,3.34,9,5v6C9,12.66,10.34,14,12,14z"/>
                                                        <path
                                                            d="M17,11c0,2.76-2.24,5-5,5s-5-2.24-5-5H5c0,3.53,2.61,6.43,6,6.92V21h2v-3.08c3.39-0.49,6-3.39,6-6.92H17z"/>
                                                    </g>
                                                </g>
                                            </svg>
                                        ) : (
                                            <div className="bg-red-600 rounded-full w-full h-full p-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" height="18px"
                                                     viewBox="0 0 24 24"
                                                     width="18px" fill="#FFFFFF">
                                                    <path d="M0 0h24v24H0V0z" fill="none"/>
                                                    <path
                                                        d="M10.8 4.9c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2l-.01 3.91L15 10.6V5c0-1.66-1.34-3-3-3-1.54 0-2.79 1.16-2.96 2.65l1.76 1.76V4.9zM19 11h-1.7c0 .58-.1 1.13-.27 1.64l1.27 1.27c.44-.88.7-1.87.7-2.91zM4.41 2.86L3 4.27l6 6V11c0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.55-.9l4.2 4.2 1.41-1.41L4.41 2.86z"/>
                                                </svg>
                                            </div>
                                        )
                                        }
                                    </span>
                                        <p className="absolute right-0 bottom-0 text-white m-2">{participant.name}</p>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
                <div className="flex flex-row justify-center gap-x-3 py-4 bg-white-400">
                    <button className="bg-white rounded-full shadow-xl p-4 focus:outline-none" onClick={toggleAudio}>
                        {
                            meeting.self.audioEnabled ? (<img src="/mic_on.svg" />) : (<img src="/mic_off.svg"/>)
                        }
                    </button>
                    <button className="bg-white rounded-full shadow-xl p-4 focus:outline-none" onClick={toggleVideo}>
                        {
                            meeting.self.videoEnabled ? (<img src="/videocam_on.svg" />) : (<img src="/videocam_off.svg"/>)
                        }
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

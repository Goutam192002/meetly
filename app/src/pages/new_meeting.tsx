import React, {ChangeEvent, useEffect, useState} from "react";
import {v4} from "uuid";
import { useAppDispatch as useDispatch } from "../hooks";
import { requestToJoinMeeting } from "../slices/meeting";
import {events} from "../constants/events";
import {RootState} from "../store";
import {useSelector} from "react-redux";
import {MeetingStatus} from "../interfaces/meeting";
import { useHistory, useLocation } from "react-router-dom";

const getMeeting = (state: RootState) => state.meeting;

const NewMeeting = () => {
    const [name, setName] = useState('');
    const dispatch = useDispatch();
    const meeting = useSelector(getMeeting);
    const history = useHistory();
    const location = useLocation();

    useEffect(() => {
        if (meeting.status === MeetingStatus.IN_MEETING) {
            history.push(`/meeting/${meeting.id}`);
        }
    });

    const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setName(event.currentTarget.value);
    }

    const startMeeting = () => {
        const params = new URLSearchParams(location.search);
        const meetingId = params.get('mid') || v4();
        dispatch(
            requestToJoinMeeting({
                socket: { event_name: events.REQUEST_JOIN, args: [meetingId, name] }
            })
        );
    }

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="flex flex-col sm:flex-row sm:space-x-16">
                <video className="w-full max-w-screen-sm" src="/video.mkv" autoPlay={true} controls={true} />
                <div className="py-8">
                    <h1 className="text-xl md:text-2xl mb-8">Start your meeting right away!</h1>
                    <input value={name} autoFocus={true} onChange={onNameChange}
                           onKeyDown={(event) => {
                                if (event.key.toLowerCase() === 'enter') {
                                    startMeeting()
                                }
                           }}
                           className="w-full mb-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-green-300 px-4 py-2 leading-5"
                           type="text"
                           placeholder="Enter your name"
                    />
                    <button className="w-full bg-green-500 rounded p-2" onClick={startMeeting}>
                        {
                            meeting.status === MeetingStatus.REQUEST_TO_JOIN ? 'Joining Meeting' : 'Start and Join Meeting'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NewMeeting;

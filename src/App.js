import React, { useEffect, useState, useCallback } from "react";
import { createMeeting, getToken, validateMeeting } from "./api";
import { MeetingConsumer, MeetingProvider } from "@videosdk.live/react-sdk";
import "./App.css";
import Participant from "./Participant";
// Separate Participant component

// Separate ParticipantsList component
const ParticipantsList = ({ participants, onMeetingClientUpdate, meeting }) => {
  useEffect(() => {
    if (meeting) {
      onMeetingClientUpdate(meeting);
    }
  }, [meeting, onMeetingClientUpdate]);

  // Convert the Map to an array of participant objects
  const participantList =
    participants instanceof Map ? Array.from(participants.values()) : [];

  console.log(participantList);

  return (
    <div className="participants-list">
      <h3>Participants:</h3>
      {participantList.map((participant) => (
        <Participant key={participant.id} participant={participant} />
      ))}
    </div>
  );
};

function App() {
  const [meetingId, setMeetingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [meetingClient, setMeetingClient] = useState(null);

  const handleMeeting = async (action) => {
    try {
      if (action === "start") {
        setLoading(true);
        setError(null);
        const response = await getToken();

        if (response) {
          setToken(response);
          const meeting = await createMeeting({ token: response });
          if (meeting?.meetingId) {
            const validation = await validateMeeting(
              meeting.meetingId,
              response
            );
            if (validation.err) {
              throw new Error(validation.err);
            } else {
              setMeetingId(validation.meetingId);
            }

            setIsConnected(true);
          } else {
            throw new Error("Failed to create meeting.");
          }
        } else {
          throw new Error("Failed to get token.");
        }
      }
    } catch (err) {
      setError(err);
      console.error("Error performing actions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = useCallback(() => {
    if (meetingClient) {
      meetingClient.leave();
      setIsConnected(false);
      setMeetingId(null);
      setToken(null);
      setError(null);
      setMeetingClient(null);
    }
  }, [meetingClient]);

  const handleMeetingClientUpdate = useCallback((meeting) => {
    setMeetingClient(meeting);
  }, []);

  useEffect(() => {
    if (isConnected) {
      console.log("Meeting is connected");
    }
  }, [isConnected]);

  useEffect(() => {
    if (meetingId && token) {
      validateMeeting(meetingId, token).catch((err) => {
        setError(err);
        setIsConnected(false);
      });
    }
  }, [meetingId, token]);

  return (
    <div className="app-container">
      <button
        onClick={() => handleMeeting("start")}
        disabled={loading || isConnected}
        className="control-button"
      >
        {loading ? "Starting..." : "Start meeting"}
      </button>

      {error && <p className="error-message">{error.message}</p>}
      {isConnected && <p className="status-message">Meeting is connected</p>}

      {meetingId && token && (
        <MeetingProvider
          config={{
            meetingId,
            participantId: `test-user-${Date.now()}`,
            webcamEnabled: true,
            micEnabled: true,
            name: `Test user`,
          }}
          token={token}
          joinWithoutUserInteraction={true}
        >
          <MeetingConsumer>
            {(meetingContext) => (
              <div className="meeting-container">
                <ParticipantsList
                  participants={meetingContext.participants}
                  onMeetingClientUpdate={handleMeetingClientUpdate}
                  meeting={meetingContext.meeting}
                />
                <button onClick={handleLeave} className="leave-button">
                  Leave Meeting
                </button>
              </div>
            )}
          </MeetingConsumer>
        </MeetingProvider>
      )}
    </div>
  );
}

export default App;

import React, { useEffect, useRef, useState } from "react";

const Participants = ({ participant }) => {
  const videoRef = useRef(null);
  const [isWebcamOn, setIsWebcamOn] = useState(participant.webcamOn);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const hasJoinedRef = useRef(false);

  // Handle video stream changes
  useEffect(() => {
    if (!videoRef.current) return;

    // Get the video track from the participant's streams
    const videoTrack = participant?.streams?.video;

    if (videoTrack) {
      // Create a MediaStream from the video track
      const mediaStream = new MediaStream([videoTrack]);

      // Set the media stream as the video element's source
      videoRef.current.srcObject = mediaStream;

      // Handle video playback
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    } else {
      // Clear the video if there's no track
      videoRef.current.srcObject = null;
    }

    // Cleanup function
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [participant?.streams?.video]); // Only re-run when video stream changes

  // Handle initial webcam setup
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        // Cleanup the test stream
        stream.getTracks().forEach((track) => track.stop());
        setPermissionGranted(true);
      } catch (error) {
        console.error("Camera permission denied:", error);
        setPermissionGranted(false);
      }
    };

    if (!hasJoinedRef.current) {
      hasJoinedRef.current = true;
      requestCameraPermission().then(() => {
        if (permissionGranted && participant.enableWebcam) {
          try {
            participant.enableWebcam();
            setIsWebcamOn(true);
          } catch (error) {
            console.error("Error enabling local webcam:", error);
          }
        }
      });
    }
  }, [participant, permissionGranted]);

  // Update webcam state when participant's webcam status changes
  useEffect(() => {
    setIsWebcamOn(participant.webcamOn);
  }, [participant.webcamOn]);

  const toggleWebcam = async () => {
    try {
      if (isWebcamOn && participant.disableWebcam) {
        await participant.disableWebcam();
      } else if (!isWebcamOn && participant.enableWebcam) {
        if (!permissionGranted) {
          await navigator.mediaDevices.getUserMedia({ video: true });
          setPermissionGranted(true);
        }
        await participant.enableWebcam();
      }
      setIsWebcamOn(!isWebcamOn);
    } catch (error) {
      console.error("Error toggling webcam:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center border border-gray-200 rounded-lg p-4 m-2 bg-gray-50">
      <h4 className="mb-2 text-lg font-medium">{participant.displayName}</h4>
      <div className="relative w-[300px] h-[200px] bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isWebcamOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
            Camera Off
          </div>
        )}
      </div>
      <button
        onClick={toggleWebcam}
        className={`mt-3 px-4 py-2 rounded-md text-white ${
          isWebcamOn
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        } transition-colors`}
      >
        {isWebcamOn ? "Turn Off Webcam" : "Turn On Webcam"}
      </button>
    </div>
  );
};

export default Participants;

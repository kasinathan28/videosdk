const API_BASE_URL = "https://api.videosdk.live";
const VIDEOSDK_TOKEN = process.env.REACT_APP_VIDEO_SDK_TOKEN;
const API_AUTH_URL = process.env.REACT_APP_AUTH_URL;

// Get Token Function
export const getToken = async () => {
  if (VIDEOSDK_TOKEN && API_AUTH_URL) {
    console.error(
      "Error: Provide only ONE PARAMETER - either Token or Auth API"
    );
    return null;
  }

  if (VIDEOSDK_TOKEN) {
    return VIDEOSDK_TOKEN;
  }

  if (API_AUTH_URL) {
    try {
      const res = await fetch(`${API_AUTH_URL}/get-token`, {
        method: "GET",
      });
      const { token } = await res.json();
      return token;
    } catch (error) {
      console.error("Error fetching token from auth server:", error);
      return null;
    }
  }

  console.error("Error: Please add a token or Auth Server URL");
  return null;
};

// Create Meeting Function
export const createMeeting = async ({ token }) => {
  const url = `${API_BASE_URL}/v2/rooms`;
  const options = {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json" },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (data.roomId) {
      return { meetingId: data.roomId, err: null };
    } else {
      return { meetingId: null, err: data.error || "Unknown error" };
    }
  } catch (error) {
    console.error("Error creating meeting:", error);
    return { meetingId: null, err: error.message };
  }
};
export const validateMeeting = async (roomId, token) => {
  const url = `${API_BASE_URL}/v2/rooms/validate/${roomId}`;
  const options = {
    method: "GET",
    headers: { Authorization: token, "Content-Type": "application/json" },
  };

  try {
    const response = await fetch(url, options);

    if (response.status === 400) {
      const data = await response.text();
      return { meetingId: null, err: data };
    }

    const data = await response.json();

    if (data.roomId) {
      return { meetingId: data.roomId, err: null };
    } else {
      return { meetingId: null, err: data.error || "Unknown error" };
    }
  } catch (error) {
    console.error("Error validating meeting:", error);
    return { meetingId: null, err: error.message };
  }
};

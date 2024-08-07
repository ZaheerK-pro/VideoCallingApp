const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const welcomeMessage = document.getElementById("welcome-message");
const startRecordingButton = document.getElementById("start-recording");
const stopRecordingButton = document.getElementById("stop-recording");
const recordingContainer = document.getElementById("recording-container");
const recordedVideo = document.getElementById("recorded-video");
const downloadLink = document.getElementById("download-link");
const yourRecordingsButton = document.querySelector(".your_recrodings");
myVideo.muted = true;

const user = prompt("Enter your name");
welcomeMessage.innerText = `Welcome, ${user}`;
welcomeMessage.style.color = "white";

var peer = new Peer({
  host: "127.0.0.1",
  port: 3030,
  path: "/peerjs",
});

let myVideoStream;
let mediaRecorder;
let recordedChunks = [];
let isRecording = false; // Flag to track recording state

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      if (url && url.length > 0) {
        recordedVideo.src = url; // Set the video source to the recorded blob URL
        recordedVideo.style.display = "block"; // Show the video player
        downloadLink.href = url; // Update download link URL
        downloadLink.style.display = "inline"; // Show the download link
        recordingContainer.style.display = "block"; // Show the recording container
      }
    };
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log("Data available", event.data);
        recordedChunks.push(event.data);
      }
    };

    startRecordingButton.addEventListener("click", () => {
      if (!isRecording) {
        // Checking if not already recording
        mediaRecorder.start();
        isRecording = true;
        startRecordingButton.style.display = "none";
        stopRecordingButton.style.display = "inline";
        alert("Recording started");
      }
    });

    stopRecordingButton.addEventListener("click", () => {
      if (isRecording) {
        // Checking if currently recording
        mediaRecorder.stop();
        isRecording = false;
        startRecordingButton.style.display = "inline";
        stopRecordingButton.style.display = "none";
        alert("Recording stopped");
      }
    });

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

const connectToNewUser = (userId, stream) => {
  console.log("I call someone" + userId);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};

peer.on("open", (id) => {
  console.log("my id is" + id);
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  console.log("VideoNewuser", video);
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const disconnectBtn = document.querySelector("#disconnect");

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background_red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background_red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background_red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background_red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", () => {
  prompt(
    "Copy this link and send it to people you want to have video call with",
    window.location.href
  );
});

disconnectBtn.addEventListener("click", () => {
  peer.destroy();
  const myVideoElement = document.querySelector("video");
  if (myVideoElement) {
    myVideoElement.remove();
  }
  socket.emit("disconnect");
  window.location.href = "https://www.google.com";
});

// Your Recordings
yourRecordingsButton.addEventListener("click", () => {
  if (recordingContainer.style.display === "none") {
    recordingContainer.style.display = "block";
  } else {
    recordingContainer.style.display = "none";
  }
});

const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs=require("fs");

const app = express();
const PORT = 5000;

// RTSP URL from your mobile IP Webcam app
const RTSP_URL = ""; // replace with your phone's stream

// Path where HLS files will be stored
const hlsPath = path.join(__dirname, "public", "hls");

if (!fs.existsSync(hlsPath)) {
  fs.mkdirSync(hlsPath, { recursive: true });
}

//Run FFmpeg to convert RTSP -> HLS
// const ffmpeg = spawn("ffmpeg", [
//   "-i", RTSP_URL,         // Input stream
//   "-c:v", "libx264",      // Video codec
//   "-preset", "ultrafast", // Low latency
//   "-f", "hls",            // Output format
//   "-hls_time", "2",       // Segment length (2s)
//   "-hls_list_size", "5",  // Keep last 5 segments
//   "-hls_flags", "delete_segments", // Auto cleanup old segments
//   path.join(hlsPath, "stream.m3u8")
// ]);


const ffmpeg = spawn("ffmpeg", [
  "-i", RTSP_URL,
  "-c:v", "libx264",
  "-preset", "ultrafast",
  "-c:a", "aac",
  "-f", "hls",
  "-hls_time", "1",
  "-hls_list_size", "10",
  "-hls_flags", "delete_segments+append_list",
  path.join(__dirname, "public", "hls", "stream.m3u8"),

  // second output: segmented mp4
  "-c:v", "libx264",
  "-preset", "ultrafast",
  "-c:a", "aac",
  "-f", "segment",                   // segment mode
  "-segment_time", "10",             // each file = 10 seconds
  "-reset_timestamps", "1",          // reset timestamps for each file
  path.join(__dirname, "public", "storage", "recording_%03d.mp4") // e.g. recording_000.mp4, recording_001.mp4
]);



// const ffmpeg = spawn("ffmpeg", [
//   "-rtsp_transport", "tcp", // more reliable than UDP
//   "-i", RTSP_URL,
//   "-fflags", "+genpts",     // regenerate timestamps
//   "-use_wallclock_as_timestamps", "1", // sync with real time
//   "-c:v", "libx264",        // re-encode video
//   "-preset", "ultrafast",
//   "-tune", "zerolatency",   // good for live
//   "-c:a", "aac",            // ensure audio encoding
//   "-ar", "44100",           // audio sample rate
//   "-f", "hls",
//   "-hls_time", "2",
//   "-hls_list_size", "5",
//   "-hls_flags", "delete_segments+append_list",
//   path.join(hlsPath, "stream.m3u8")
// ]);


ffmpeg.stderr.on("data", (data) => {
  console.log(`FFmpeg: ${data}`);
});

ffmpeg.on("close", (code) => {
  console.log(`FFmpeg process exited with code ${code}`);
});

// const ffmpegMP4 = spawn("ffmpeg", [
//   "-i", RTSP_URL,     // Input stream
//   "-c:v", "copy",     // Copy video (no re-encode)
//   "-c:a", "aac",      // Encode audio to AAC
//   "-f", "mp4",        // Output format MP4
//   mp4Path
// ]);

// const ffmpegMP4 = spawn("ffmpeg", [
//   "-i", RTSP_URL,
//   "-c:v", "libx264",      // Re-encode video
//   "-preset", "ultrafast", // Faster encoding, bigger file
//   "-c:a", "aac",          // Re-encode audio
//   "-f", "mp4",
//   mp4Path
// ]);

// const ffmpegMP4 = spawn("ffmpeg", [
//   "-i", RTSP_URL,
//   "-c:v", "libx264",      // re-encode to H.264
//   "-preset", "ultrafast", // less CPU, bigger file
//   "-c:a", "aac",          // re-encode audio
//   "-movflags", "faststart",
//   mp4Path
// ]);



ffmpeg.stderr.on("data", (data) => {
  console.log(`[MP4] ${data}`);
});

ffmpeg.on("close", (code) => {
  console.log(`[MP4] FFmpeg exited with code ${code}`);
});

// Serve static HLS files
app.use("/hls", express.static(hlsPath));

app.get("/", (req, res) => {
  res.sendFile( __dirname + "/stream.html" );
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Stream available at http://localhost:${PORT}/hls/stream.m3u8`);
});

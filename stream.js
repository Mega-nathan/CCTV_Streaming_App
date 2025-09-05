const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs=require("fs");

const app = express();
const PORT = 3000;

// RTSP URL from your mobile IP Webcam app
const RTSP_URL = "rtsp://199.168.1.100:554/h264_ulaw.sdp"; // replace with your phone's stream

// Path where HLS files will be stored
const hlsPath = path.join(__dirname, "public", "hls");

if (!fs.existsSync(hlsPath)) {
  fs.mkdirSync(hlsPath, { recursive: true });
}

// Run FFmpeg to convert RTSP -> HLS
const ffmpeg = spawn("ffmpeg", [
  "-i", RTSP_URL,         // Input stream
  "-c:v", "libx264",      // Video codec
  "-preset", "ultrafast", // Low latency
  "-f", "hls",            // Output format
  "-hls_time", "2",       // Segment length (2s)
  "-hls_list_size", "5",  // Keep last 5 segments
  "-hls_flags", "delete_segments", // Auto cleanup old segments
  path.join(hlsPath, "stream.m3u8")
]);

ffmpeg.stderr.on("data", (data) => {
  console.log(`FFmpeg: ${data}`);
});

ffmpeg.on("close", (code) => {
  console.log(`FFmpeg process exited with code ${code}`);
});

// Serve static HLS files
app.use("/hls", express.static(hlsPath));

// Simple health check
app.get("/", (req, res) => {
  res.sendFile( __dirname + "/stream.html" );
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Stream available at http://localhost:${PORT}/hls/stream.m3u8`);
});

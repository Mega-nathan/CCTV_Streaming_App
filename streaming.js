const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// RTSP URL from your mobile IP Webcam app
const RTSP_URL = "";

// Paths for HLS and MP4 output
const hlsPath = path.join(__dirname, "public", "hls");
const mp4Path = path.join(__dirname, "public" , "storage" , "recorded_video.mp4");

// Create HLS directory if it doesn't exist
if (!fs.existsSync(hlsPath)) {
  fs.mkdirSync(hlsPath, { recursive: true });
}

// --- 1. FFmpeg: Convert RTSP -> HLS for live streaming ---
const ffmpegHLS = spawn("ffmpeg", [
  "-i", RTSP_URL,                // Input stream
  "-c:v", "libx264",             // Video codec
  "-preset", "ultrafast",        // Low latency
  "-f", "hls",                   // HLS format
  "-hls_time", "2",               // 2-second segments
  "-hls_list_size", "5",          // Keep last 5 segments
  "-hls_flags", "delete_segments", // Auto-delete old segments
  path.join(hlsPath, "stream.m3u8")
]);

ffmpegHLS.stderr.on("data", (data) => {
  console.log(`[HLS] ${data}`);
});

ffmpegHLS.on("close", (code) => {
  console.log(`[HLS] FFmpeg exited with code ${code}`);
});

// --- 2. FFmpeg: Record RTSP -> MP4 ---
const ffmpegMP4 = spawn("ffmpeg", [
  "-i", RTSP_URL,     // Input stream
  "-c:v", "copy",     // Copy video (no re-encode)
  "-c:a", "aac",      // Encode audio to AAC
  "-f", "mp4",        // Output format MP4
  mp4Path
]);

ffmpegMP4.stderr.on("data", (data) => {
  console.log(`[MP4] ${data}`);
});

ffmpegMP4.on("close", (code) => {
  console.log(`[MP4] FFmpeg exited with code ${code}`);
});

// --- 3. Express: Serve HLS files ---
app.use("/hls", express.static(hlsPath));

// Serve HTML page with video player
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/stream.html");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Live stream: http://localhost:${PORT}/hls/stream.m3u8`);
  console.log(`Recording to: ${mp4Path}`);
});

# Pothys Swarna Mahal — Gold Training Program
## Standalone Offline Presentation Engine (HTML5 / CSS3 / JavaScript)

Welcome to the **Pothys Swarna Mahal Gold Training Program Presentation**. This presentation is built as an ultra-crisp, browser-based, standalone application designed for zero-dependency offline presentation on any Windows computer.

---

### 1. How to Launch
To start the presentation, simply **double-click** either:
- **`Launch_Presentation.bat`** (Recommended batch launcher), or
- **`Launch_Presentation.exe`** (Native Windows executable with system tray icon), or
- **`Launch_Presentation.vbs`** (Silent launcher without terminal window)

The presentation will automatically start a local loopback web server and open your default browser to `http://127.0.0.1:<port>/index.html`.

> [!NOTE]
> **No Internet Connection Required:** All images, fonts (Cinzel, Montserrat), GSAP libraries, and video assets are 100% bundled locally within this directory.
> **No Python, Node.js, or PowerPoint Required:** Runs natively using standard Windows components.

---

### 2. Presentation Controls & Navigation

| Action | Control / Key |
| :--- | :--- |
| **Next Slide** | `Right Arrow`, `Spacebar`, `PageDown`, `Down Arrow`, or click right screen edge |
| **Previous Slide** | `Left Arrow`, `PageUp`, `Up Arrow`, `Backspace`, or click left screen edge |
| **First Slide (Slide 1)** | `Home` |
| **Last Slide (Slide 42)** | `End` |
| **Toggle Fullscreen Mode** | `F` key or click the Fullscreen icon (top-right) |
| **Slide Overview Grid** | `M` key, click Grid icon (top-right), or click the bottom counter badge |
| **Direct Slide Scrubbing** | Click anywhere on the bottom golden progress bar |
| **Slide 39 Video Controls** | Click video to Play/Pause; hover over video to access progress bar and volume |
| **Exit Overview / Fullscreen**| `Escape` |

---

### 3. Signature Features

1. **Combined Golden Particle Sweep & Royal Gold Silk Reveal Transition:**
   - Every slide navigation triggers a dynamic 60 FPS animation combining a flowing golden silk ribbon with glowing 24K gold particles flowing organically across the screen.
   - The current slide gently recedes into depth while the incoming slide emerges behind the flowing gold ribbon.
   - When idle, GPU/CPU usage is **0.0%**.

2. **Full-Screen 16:9 Coverage:**
   - Calibrated for 100% full-screen display at 1920×1080 (and all 16:9 resolutions).
   - Zero black borders, zero empty margins, and zero stretching distortion.

3. **Slide 39 Native Playable Video:**
   - Video (`media/slide 39 video.mp4`) plays inside the golden presentation frame with full playback, scrubbing, and audio controls.
   - Automatically pauses when leaving Slide 39.

4. **Slide 40 Inset Sizing Jewellery:**
   - Positioned cleanly within the golden frame at exact proportions without clipping or distortion.

5. **Slide Overview Grid (Modal Drawer):**
   - Press `M` anytime to view all 42 slides at a glance and jump directly to any slide.

6. **Automatic Clean Shutdown:**
   - The background presentation server monitors an automated heartbeat from your browser tab. Closing your browser tab cleanly exits the server within 90 seconds. You can also right-click the golden tray icon in your Windows taskbar and choose **Exit Presentation**.

---

### 4. Folder Contents
```text
Gold_Presentation_Portable/
│── index.html                  # Main presentation shell
│── style.css                   # Royal maroon & 24K gold styling
│── script.js                   # Presentation engine & silk transition
│── slides-manifest.js          # Complete 42-slide metadata & titles
│── Launch_Presentation.bat     # One-click Windows batch launcher
│── Launch_Presentation.exe     # Native compiled Windows launcher
│── Launch_Presentation.vbs     # Silent background launcher
│── server.ps1                  # Portable PowerShell server with byte-range streaming
│── Launcher.cs                 # C# source code for Launcher.exe
│── app.ico & favicon.ico       # Pothys branding icons
│── gsap.min.js & Flip.min.js   # Offline animation libraries
│── README.md                   # This instruction manual
│── fonts/                      # Offline Cinzel & Montserrat web fonts
│── media/                      # Slide 39 video & Slide 40 image
└── slides/                     # High-definition 1920x1080 slides (01 to 42)
```

---
*Pothys Swarna Mahal — Idhu Paripooranathin Adayalam (A Mark of Perfection)*


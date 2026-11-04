# Pothys Swarna Mahal — Gold Training Program
### Interactive Offline Presentation System (HTML5 / CSS3 / JavaScript)

[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Cross--Platform-gold.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20External-darkgreen.svg)](#)
[![Resolution](https://img.shields.io/badge/Aspect%20Ratio-16%3A9%20Widescreen%20(1080p%20%2F%204K)-D4AF37.svg)](#)
[![Offline Ready](https://img.shields.io/badge/Offline-100%25%20Self--Contained-blue.svg)](#)

---

## 1. Project Overview

The **Pothys Swarna Mahal — Gold Training Program** is a browser-based, standalone, offline training presentation application. Designed to replace traditional slide decks with an interactive experience, this presentation runs locally on loopback localhost with zero external dependencies (no internet connection, Python, Node.js, or Microsoft PowerPoint required).

The application preserves the royal visual identity of **Pothys Swarna Mahal** (*Idhu Paripooranathin Adayalam*), featuring a rich Maroon (`#2B050B`) and 24K Gold (`#D4AF37`) palette, high-definition 16:9 widescreen slides, Tamil and English typography, and an interactive video player.

---

## 2. Key Features & Signature Animations

### 🌟 Royal Gold Silk & 24K Particle Sweep Transition
- **Combined Kinetic Reveal:** When navigating between slides, the outgoing slide recedes into 3D depth while an undulating, flowing golden silk ribbon sweeps across the canvas accompanied by a stream of luminous 24K gold stardust particles (3 depth tiers: glowing foreground auras, midground luster, and ambient shimmer).
- **Smooth 60 FPS Rendering:** Driven by an optimized HTML5 Canvas and CSS 3D transform pipeline.
- **0.0% CPU When Idle:** The canvas animation loop automatically suspends when not actively transitioning, ensuring zero processor overhead during lectures or training sessions.
- **Directional Sensitivity:** Transitions flow naturally from left-to-right when moving forward, and right-to-left when moving backward.

### 📺 Slide 39: Native Playable Video
- Slide 39 features an embedded HTML5 video player mounted inside the golden ornate display frame (`left: 56.85%`, `top: 38.41%`, `width: 33.27%`, `height: 33.22%`).
- Features custom-themed playback controls: Play/Pause toggle, progress seek bar, elapsed/total time readout, and volume/mute control.
- Supported by **HTTP 206 Partial Content byte-range streaming** for instant scrubbing and playback without buffering stalls.
- Automatically pauses when navigating away from Slide 39.

### 💎 Slide 40: Inset Sizing Jewellery
- Slide 40 displays authentic jewellery sizing guidelines with the sample product photography composited cleanly within the golden frame at exact proportions without clipping or distortion.

### 📐 Full-Screen 16:9 Widescreen Canvas
- Calibrated for 100% full-screen coverage at 1920×1080 (and all 16:9 displays).
- Zero black borders, zero empty margins, and zero stretching distortion.

### 🗂️ Interactive Slide Overview Grid (Modal Drawer)
- Press **`M`** or click the bottom counter badge anytime to summon the 42-slide overview drawer. Jump directly to any slide with a single click.

---

## 3. How to Run Locally

You do not need to install Node.js, Python, or Microsoft Office. The project runs out-of-the-box on any modern Windows machine:

1. **Clone or extract the repository:**
   ```bash
   git clone https://github.com/spartan117here/gold_ppt.git
   cd gold_ppt
   ```

2. **Launch the presentation:**
   Simply **double-click**:
   - **`Launch_Presentation.bat`** (Primary one-click batch launcher)

3. **What happens automatically:**
   - The launcher starts a local zero-dependency loopback web server.
   - Automatically detects an open port (tries `8080`, `8000`, `8085`, etc.).
   - Launches your default web browser directly to `http://localhost:<port>/index.html`.
   - **Enterprise Security Policy Safe:** If your Windows computer has strict Windows Defender Application Control (WDAC), Smart App Control, or AppLocker enabled, the launcher detects restrictions and falls back safely to direct local browser presentation with zero errors.
   - Monitors an automated browser heartbeat and cleanly shuts down 90 seconds after closing the presentation tab.

4. **How to Stop:**
   - Double-click **`Stop_Presentation.bat`**, or
   - Press any key in the launcher console window.

---

## 4. Dependencies & Technical Stack

| Component | Technology | Offline Status |
| :--- | :--- | :--- |
| **Presentation Shell** | HTML5, CSS3, ES6 JavaScript | 100% Bundled Locally |
| **Typography** | Cinzel (Headings), Montserrat (Body) | Local TTF files in `fonts/` |
| **Animation Engine** | GSAP 3.12, Flip.js, Custom 2D Canvas | Local scripts in root |
| **Local Web Server** | PowerShell Loopback (Pure .NET Sockets) | Native Windows components |
| **Video Playback** | HTML5 Native Video + HTTP 206 Streaming | Local MP4 in `media/` |

---

## 5. Presentation Controls & Keyboard Shortcuts

| Action | Keyboard / Mouse Control |
| :--- | :--- |
| **Next Slide** | `Right Arrow`, `Spacebar`, `PageDown`, `Down Arrow`, or click right screen edge |
| **Previous Slide** | `Left Arrow`, `PageUp`, `Up Arrow`, `Backspace`, or click left screen edge |
| **First Slide (Slide 1)** | `Home` |
| **Last Slide (Slide 42)** | `End` |
| **Toggle Fullscreen Mode** | `F` key or click top-right Fullscreen button |
| **Slide Overview Grid** | `M` key, click top-right Grid button, or click bottom counter badge |
| **Direct Scrubbing** | Click anywhere along the bottom progress bar track |
| **Slide 39 Video** | Click video or Play button to toggle playback; hover for volume/scrubber |
| **Close Drawer / Exit Fullscreen** | `Escape` |
| **Touchscreen / Mobile** | Swipe left for Next, swipe right for Previous |

---

## 6. Project & Directory Structure

```text
gold_ppt/
│── Launch_Presentation.bat         # Root shortcut launcher
│── Stop_Presentation.bat           # Root shutdown utility
│── README.md                       # Repository documentation
│── .gitignore                      # Git exclusion rules
│── .gitattributes                  # Git LFS attributes for media
│── Gold Training_29.10.26.pptx     # Master 16:9 PowerPoint source
│── build_final_presentation.py     # Slide processing & build script
│
├── Gold_Presentation_Portable/     # STANDALONE INTERACTIVE WEB PRESENTATION
│   ├── index.html                  # Core presentation markup
│   ├── style.css                   # Royal maroon & gold luxury styling
│   ├── script.js                   # Presentation engine & silk transition
│   ├── slides-manifest.js          # Complete 42-slide metadata specification
│   ├── Launch_Presentation.bat     # Primary launcher batch file
│   ├── Stop_Presentation.bat       # Shutdown utility batch file
│   ├── server.ps1                  # Loopback web server with HTTP 206 streaming
│   ├── app.ico & favicon.ico       # Pothys brand icons
│   ├── gsap.min.js & Flip.min.js   # Offline animation libraries
│   ├── README.md                   # Portable folder user guide
│   ├── fonts/                      # Offline Cinzel & Montserrat font files
│   ├── media/                      # Slide 39 MP4 video & Slide 40 inset PNG
│   └── slides/                     # Ultra-sharp 1920x1080 slides (01 to 42)
│
├── new slides/                     # Source assets for updated slides 36–42
└── extracted_media/                # Original extracted PowerPoint graphics
```

---

## 7. How to Add or Replace Slides and Media

### Replacing an Existing Slide:
1. Export or create the new slide image in **16:9 widescreen format** (recommended: **1920×1080**).
2. Save it with the corresponding name inside `Gold_Presentation_Portable/slides/` (e.g., `slide_08.png`).
3. Refresh the presentation in your browser (`Ctrl+F5`).

### Updating Titles or Tamil Descriptions:
1. Open `Gold_Presentation_Portable/slides-manifest.js` in any text editor.
2. Locate the slide entry by its `id`:
   ```javascript
   {
     "id": 8,
     "image": "slides/slide_08.png",
     "title": "ENGRAVING WORK",
     "titleTamil": "செதுக்கல் வேலைப்பாடு (Engraving Work)",
     "chapter": "Craftsmanship & Manufacturing",
     "transition": "goldSilkSweep",
     "duration": 1.2
   }
   ```
3. Edit the `title`, `titleTamil`, or `chapter` text and save.

### Replacing Slide 39 Video:
1. Place the new MP4 video in `Gold_Presentation_Portable/media/slide 39 video.mp4`.
2. The player will automatically stream the new video.

---

## 8. License & Attribution

Designed and developed for **Pothys Swarna Mahal — Gold Training Program**.  
*Idhu Paripooranathin Adayalam (A Mark of Perfection).*

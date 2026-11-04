/**
 * Pothys Swarna Mahal — Gold Training Program
 * Presentation Engine & Royal Gold Silk + Particle Transition System
 * Features: 16:9 Cinema Viewport, Video Player, Keyboard/Touch Navigation, Heartbeat
 */

(function () {
    'use strict';

    // State Variables
    let currentIndex = 0;
    let isAnimating = false;
    let animationProgress = 0;
    let animStartTime = 0;
    let animDuration = 1250; // 1.25 seconds
    let animDirection = 1; // 1 for next, -1 for prev
    let targetSlideIndex = 0;
    let rafId = null;
    let isDrawerOpen = false;

    const slides = window.SLIDES_MANIFEST || [];
    const totalSlides = slides.length;

    // DOM Elements
    const slideStage = document.getElementById('slide-stage');
    const activeSlideImg = document.getElementById('active-slide-img');
    const transitionStage = document.getElementById('transition-stage');
    const transOut = document.getElementById('trans-out');
    const transIn = document.getElementById('trans-in');
    const transOutImg = document.getElementById('trans-out-img');
    const transInImg = document.getElementById('trans-in-img');
    const fxCanvas = document.getElementById('fx-canvas');
    const fxCtx = fxCanvas.getContext('2d');

    // Controls & Overlays
    const currNumEl = document.getElementById('curr-num');
    const progressFill = document.getElementById('progress-fill');
    const progressTrack = document.getElementById('progress-track');
    const pillChapter = document.getElementById('pill-chapter');
    const pillTitle = document.getElementById('pill-title');
    const fsBtn = document.getElementById('fsBtn');
    const fsEnterIcon = document.getElementById('fs-enter-icon');
    const fsExitIcon = document.getElementById('fs-exit-icon');
    const menuBtn = document.getElementById('menuBtn');
    const slideDrawer = document.getElementById('slide-drawer');
    const drawerClose = document.getElementById('drawer-close');
    const drawerGrid = document.getElementById('drawer-grid');
    const navPrev = document.getElementById('nav-prev');
    const navNext = document.getElementById('nav-next');
    const arrowPrev = document.getElementById('arrow-prev');
    const arrowNext = document.getElementById('arrow-next');

    // Video Elements (Slide 39)
    const videoWrapper = document.getElementById('video-wrapper');
    const slideVideo = document.getElementById('slide-video');
    const vPlayBtn = document.getElementById('v-play-btn');
    const vSeekBar = document.getElementById('v-seek-bar');
    const vSeekFill = document.getElementById('v-seek-fill');
    const vTimeDisplay = document.getElementById('v-time-display');
    const vMuteBtn = document.getElementById('v-mute-btn');

    // Particle System Variables
    const PARTICLE_COUNT = 150;
    let particles = [];

    // Preload Slide Images for Instant Smoothness
    const preloadedImages = [];
    function preloadAllImages() {
        slides.forEach((s) => {
            const img = new Image();
            img.src = s.image;
            preloadedImages.push(img);
        });
    }

    // Initialize Canvas Dimensions
    function resizeCanvas() {
        if (!fxCanvas) return;
        fxCanvas.width = window.innerWidth;
        fxCanvas.height = window.innerHeight;
    }

    // Particle Constructor
    class GoldParticle {
        constructor(width, height, dir) {
            this.reset(width, height, dir, true);
        }

        reset(width, height, dir, initial = false) {
            this.dir = dir;
            // Spawn along the moving silk wave
            if (dir > 0) {
                this.x = initial ? Math.random() * width * 0.2 : -20 - Math.random() * 80;
            } else {
                this.x = initial ? width - Math.random() * width * 0.2 : width + 20 + Math.random() * 80;
            }
            this.y = Math.random() * height;
            
            // 3 depth tiers
            const tier = Math.random();
            if (tier > 0.8) {
                // Foreground: larger, faster, luminous
                this.radius = 3.5 + Math.random() * 3.5;
                this.vx = (dir > 0 ? 1 : -1) * (14 + Math.random() * 10);
                this.vy = (Math.random() - 0.5) * 4;
                this.alpha = 0.8 + Math.random() * 0.2;
                this.glow = 12;
            } else if (tier > 0.4) {
                // Midground: golden luster
                this.radius = 2.0 + Math.random() * 2.0;
                this.vx = (dir > 0 ? 1 : -1) * (9 + Math.random() * 7);
                this.vy = (Math.random() - 0.5) * 2.5;
                this.alpha = 0.6 + Math.random() * 0.3;
                this.glow = 6;
            } else {
                // Background stardust: tiny shimmer
                this.radius = 1.0 + Math.random() * 1.5;
                this.vx = (dir > 0 ? 1 : -1) * (5 + Math.random() * 5);
                this.vy = (Math.random() - 0.5) * 1.5;
                this.alpha = 0.4 + Math.random() * 0.3;
                this.glow = 2;
            }
            
            this.baseY = this.y;
            this.freq = 0.008 + Math.random() * 0.015;
            this.phase = Math.random() * Math.PI * 2;
            this.decay = 0.004 + Math.random() * 0.006;
        }

        update(width, height) {
            this.x += this.vx;
            this.y = this.baseY + Math.sin(this.x * this.freq + this.phase) * 35;
            this.alpha -= this.decay;
            if (this.alpha < 0) this.alpha = 0;
        }

        draw(ctx) {
            if (this.alpha <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.shadowColor = 'rgba(255, 230, 130, 0.8)';
            ctx.shadowBlur = this.glow;
            
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.3, '#FFF4B8');
            grad.addColorStop(0.7, '#D4AF37');
            grad.addColorStop(1, 'rgba(180, 130, 20, 0)');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function initParticles(width, height, dir) {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new GoldParticle(width, height, dir));
        }
    }

    // Cubic Bezier Ease In Out for Silk Timing
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // =========================================================================
    // Signature Animation: Royal Gold Silk + Particle Sweep
    // =========================================================================
    function runGoldSilkTransition(targetIndex, dir, durationMs) {
        animStartTime = performance.now();
        animDuration = durationMs || 1250;
        animDirection = dir;
        targetSlideIndex = targetIndex;
        animationProgress = 0;

        const outSlide = slides[currentIndex];
        const inSlide = slides[targetIndex];

        // Prepare Transition Elements
        transOutImg.src = outSlide.image;
        transInImg.src = inSlide.image;

        // Reset Card Transforms
        transOut.style.transform = 'scale(1) translateZ(0px)';
        transOut.style.opacity = '1';
        transOut.style.clipPath = 'none';

        transIn.style.transform = 'scale(1.03) translateZ(30px)';
        transIn.style.opacity = '0';
        transIn.style.clipPath = dir > 0 ? 'polygon(0 0, 0 0, 0 100%, 0 100%)' : 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)';

        // Display Transition Stage, hide active stage & video
        transitionStage.style.display = 'flex';
        slideStage.style.display = 'none';
        if (videoWrapper) videoWrapper.style.display = 'none';
        if (slideVideo) slideVideo.pause();

        // Initialize particles
        initParticles(fxCanvas.width, fxCanvas.height, dir);

        // Update Bottom Counter immediately for responsiveness
        updateCounter(targetIndex, true);

        // Start 60 FPS Render Loop
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(renderTransitionFrame);
    }

    function renderTransitionFrame(now) {
        const elapsed = now - animStartTime;
        let t = elapsed / animDuration;
        if (t > 1) t = 1;
        animationProgress = t;

        const easedT = easeInOutCubic(t);
        const W = fxCanvas.width;
        const H = fxCanvas.height;

        // 1. Calculate Silk Wave Head Position
        let waveX = 0;
        if (animDirection > 0) {
            // Left to Right sweep: starts at -0.15*W, ends at 1.25*W
            waveX = -0.15 * W + easedT * (1.4 * W);
        } else {
            // Right to Left sweep: starts at 1.15*W, ends at -0.25*W
            waveX = 1.15 * W - easedT * (1.4 * W);
        }

        // 2. Synchronize Incoming Slide Clip & Depth Transforms
        if (animDirection > 0) {
            const clipX1 = Math.max(0, Math.min(W, waveX + 80));
            const clipX2 = Math.max(0, Math.min(W, waveX - 80));
            transIn.style.clipPath = `polygon(0 0, ${clipX1}px 0, ${clipX2}px 100%, 0 100%)`;
        } else {
            const clipX1 = Math.max(0, Math.min(W, waveX - 80));
            const clipX2 = Math.max(0, Math.min(W, waveX + 80));
            transIn.style.clipPath = `polygon(${clipX1}px 0, 100% 0, 100% 100%, ${clipX2}px 100%)`;
        }

        // Outgoing slide floats gently backwards and fades
        const outScale = 1.0 - easedT * 0.05;
        const outZ = -easedT * 120;
        const outOpacity = Math.max(0, 1.0 - easedT * 1.2);
        transOut.style.transform = `scale(${outScale}) translateZ(${outZ}px)`;
        transOut.style.opacity = outOpacity.toFixed(3);

        // Incoming slide emerges with depth settle
        const inScale = 1.03 - easedT * 0.03;
        const inOpacity = Math.min(1.0, easedT * 1.4);
        transIn.style.transform = `scale(${inScale}) translateZ(0px)`;
        transIn.style.opacity = inOpacity.toFixed(3);

        // 3. Render Canvas: Royal Gold Silk Ribbon & Glowing Particles
        fxCtx.clearRect(0, 0, W, H);

        drawRoyalGoldSilk(fxCtx, W, H, waveX, easedT, animDirection, elapsed);
        drawParticles(fxCtx, W, H, waveX, animDirection);

        // 4. Check for Completion
        if (t < 1) {
            rafId = requestAnimationFrame(renderTransitionFrame);
        } else {
            finalizeTransition(targetSlideIndex);
        }
    }

    // Draw the Multi-Layer Flowing Silk Ribbon
    function drawRoyalGoldSilk(ctx, W, H, waveX, t, dir, elapsed) {
        ctx.save();

        const ribbonWidth = 240 + Math.sin(t * Math.PI) * 160;
        const ribbonLeft = dir > 0 ? waveX - ribbonWidth : waveX;
        const ribbonRight = dir > 0 ? waveX : waveX + ribbonWidth;

        // Draw multiple undulating silk folds
        for (let fold = 0; fold < 3; fold++) {
            ctx.beginPath();

            const foldOffset = fold * 35;
            const timeScale = elapsed * 0.003 + fold;

            if (dir > 0) {
                // Sweep left to right
                ctx.moveTo(ribbonLeft - foldOffset, 0);

                // Top wave control
                const cp1x = waveX - 50 + Math.sin(timeScale) * 60;
                const cp1y = H * 0.25;
                const cp2x = waveX + 30 + Math.cos(timeScale * 1.3) * 50;
                const cp2y = H * 0.75;
                const endX = waveX - 20;

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, H);
                ctx.lineTo(endX + 60, H);
                ctx.bezierCurveTo(cp2x + 70, cp2y, cp1x + 70, cp1y, waveX + 60, 0);
            } else {
                // Sweep right to left
                ctx.moveTo(ribbonRight + foldOffset, 0);

                const cp1x = waveX + 50 - Math.sin(timeScale) * 60;
                const cp1y = H * 0.25;
                const cp2x = waveX - 30 - Math.cos(timeScale * 1.3) * 50;
                const cp2y = H * 0.75;
                const endX = waveX + 20;

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, H);
                ctx.lineTo(endX - 60, H);
                ctx.bezierCurveTo(cp2x - 70, cp2y, cp1x - 70, cp1y, waveX - 60, 0);
            }

            ctx.closePath();

            // Rich 24K Gold Gradient with Silk Sheen
            const foldAlpha = Math.sin(t * Math.PI) * (0.85 - fold * 0.2);
            if (foldAlpha > 0) {
                const silkGrad = ctx.createLinearGradient(ribbonLeft, 0, ribbonRight, H * 0.5);
                silkGrad.addColorStop(0, `rgba(160, 110, 20, 0)`);
                silkGrad.addColorStop(0.25, `rgba(212, 175, 55, ${foldAlpha * 0.7})`);
                silkGrad.addColorStop(0.5, `rgba(255, 248, 190, ${foldAlpha})`); // Lustrous crest
                silkGrad.addColorStop(0.75, `rgba(224, 185, 60, ${foldAlpha * 0.75})`);
                silkGrad.addColorStop(1, `rgba(140, 90, 15, 0)`);

                ctx.fillStyle = silkGrad;
                ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
                ctx.shadowBlur = 16 - fold * 4;
                ctx.fill();
            }
        }

        // Leading edge high-specular gold light spine
        ctx.beginPath();
        const spineX = waveX;
        ctx.moveTo(spineX, 0);
        ctx.bezierCurveTo(spineX + 20, H * 0.35, spineX - 20, H * 0.7, spineX, H);
        ctx.strokeStyle = `rgba(255, 255, 220, ${Math.sin(t * Math.PI) * 0.9})`;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 12;
        ctx.stroke();

        ctx.restore();
    }

    // Draw Dynamic Gold Particles
    function drawParticles(ctx, W, H, waveX, dir) {
        particles.forEach((p) => {
            // Keep particles orbiting near the silk wave
            if (dir > 0 && p.x < waveX - 300) {
                p.x = waveX + (Math.random() - 0.3) * 150;
                p.alpha = 0.8 + Math.random() * 0.2;
            } else if (dir < 0 && p.x > waveX + 300) {
                p.x = waveX - (Math.random() - 0.3) * 150;
                p.alpha = 0.8 + Math.random() * 0.2;
            }

            p.update(W, H);
            p.draw(ctx);
        });
    }

    // Finalize Transition & Clean Up
    function finalizeTransition(targetIndex) {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        // Clear Canvas (Zero CPU usage when idle)
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

        currentIndex = targetIndex;
        const curSlide = slides[currentIndex];

        // Update Active Slide Image
        activeSlideImg.src = curSlide.image;
        activeSlideImg.alt = curSlide.title || `Slide ${currentIndex + 1}`;

        // Switch stages
        slideStage.style.display = 'flex';
        transitionStage.style.display = 'none';

        // Setup Slide 39 Video if applicable
        if (curSlide.hasVideo) {
            setupVideoPlayer();
        } else {
            if (videoWrapper) videoWrapper.style.display = 'none';
            if (slideVideo) slideVideo.pause();
        }

        // Update Pill Info
        updateSlideInfoPill(currentIndex);

        // Update Drawer Active Item
        updateDrawerActiveState(currentIndex);

        isAnimating = false;
    }

    // =========================================================================
    // Video Player Management (Slide 39)
    // =========================================================================
    function setupVideoPlayer() {
        if (!videoWrapper || !slideVideo) return;
        videoWrapper.style.display = 'flex';
        slideVideo.currentTime = 0;
        
        // Play automatically with audio
        const playPromise = slideVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                updatePlayPauseIcons(true);
            }).catch(() => {
                // If browser autoplay policy requires user gesture, mute first
                slideVideo.muted = true;
                slideVideo.play().then(() => updatePlayPauseIcons(true)).catch(() => {});
            });
        }
    }

    function toggleVideoPlay() {
        if (!slideVideo) return;
        if (slideVideo.paused) {
            slideVideo.play();
            updatePlayPauseIcons(true);
        } else {
            slideVideo.pause();
            updatePlayPauseIcons(false);
        }
    }

    function updatePlayPauseIcons(isPlaying) {
        const iconPlay = vPlayBtn ? vPlayBtn.querySelector('.icon-play') : null;
        const iconPause = vPlayBtn ? vPlayBtn.querySelector('.icon-pause') : null;
        if (iconPlay && iconPause) {
            iconPlay.style.display = isPlaying ? 'none' : 'block';
            iconPause.style.display = isPlaying ? 'block' : 'none';
        }
    }

    function formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    // =========================================================================
    // Navigation Dispatches
    // =========================================================================
    function nextSlide() {
        if (isAnimating) return;
        if (currentIndex < totalSlides - 1) {
            goToSlide(currentIndex + 1, 1);
        }
    }

    function prevSlide() {
        if (isAnimating) return;
        if (currentIndex > 0) {
            goToSlide(currentIndex - 1, -1);
        }
    }

    function goToSlide(targetIndex, dir = null) {
        if (isAnimating || targetIndex === currentIndex) return;
        if (targetIndex < 0 || targetIndex >= totalSlides) return;

        isAnimating = true;
        const direction = dir !== null ? dir : (targetIndex > currentIndex ? 1 : -1);
        const curDuration = slides[targetIndex].duration ? slides[targetIndex].duration * 1000 : 1250;

        runGoldSilkTransition(targetIndex, direction, curDuration);
    }

    // =========================================================================
    // UI Helpers: Counter, Pill, Fullscreen, Drawer
    // =========================================================================
    function updateCounter(index, animate = true) {
        const targetNum = index + 1;
        const targetPercent = (targetNum / totalSlides) * 100;

        if (progressFill) progressFill.style.width = `${targetPercent}%`;
        if (currNumEl) currNumEl.textContent = targetNum;

        // Hash sync without history pollution
        try {
            if (history.replaceState) {
                history.replaceState(null, null, `#slide-${targetNum}`);
            }
        } catch (e) {}
    }

    function updateSlideInfoPill(index) {
        const s = slides[index];
        if (pillChapter) pillChapter.textContent = s.chapter || 'Pothys Swarna Mahal';
        if (pillTitle) pillTitle.textContent = s.title || `Slide ${index + 1}`;
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            const root = document.documentElement;
            if (root.requestFullscreen) root.requestFullscreen();
            else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
    }

    function updateFullscreenIcons() {
        const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (fsEnterIcon) fsEnterIcon.style.display = isFS ? 'none' : 'block';
        if (fsExitIcon) fsExitIcon.style.display = isFS ? 'block' : 'none';
    }

    function toggleDrawer(open) {
        if (open === undefined) open = !isDrawerOpen;
        isDrawerOpen = open;
        if (slideDrawer) {
            slideDrawer.style.display = isDrawerOpen ? 'flex' : 'none';
            if (isDrawerOpen) updateDrawerActiveState(currentIndex);
        }
    }

    function buildDrawerGrid() {
        if (!drawerGrid) return;
        drawerGrid.innerHTML = '';

        slides.forEach((s, idx) => {
            const card = document.createElement('div');
            card.className = `grid-card ${idx === currentIndex ? 'active' : ''}`;
            card.dataset.index = idx;
            card.innerHTML = `
                <img class="grid-thumb" src="${s.image}" alt="Slide ${idx + 1}" loading="lazy">
                <div class="grid-meta">
                    <div class="grid-meta-top">
                        <span>SLIDE ${idx + 1}</span>
                        <span>${s.chapter}</span>
                    </div>
                    <div class="grid-meta-title" title="${s.title}">${s.title}</div>
                </div>
            `;
            card.addEventListener('click', () => {
                toggleDrawer(false);
                goToSlide(idx);
            });
            drawerGrid.appendChild(card);
        });
    }

    function updateDrawerActiveState(index) {
        if (!drawerGrid) return;
        const cards = drawerGrid.querySelectorAll('.grid-card');
        cards.forEach((card, idx) => {
            if (idx === index) {
                card.classList.add('active');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                card.classList.remove('active');
            }
        });
    }

    // =========================================================================
    // Event Listeners
    // =========================================================================
    function setupEventListeners() {
        // Window Resize
        window.addEventListener('resize', resizeCanvas);

        // Keyboard Navigation
        document.addEventListener('keydown', (e) => {
            // If drawer is open, Escape closes it
            if (isDrawerOpen && e.key === 'Escape') {
                toggleDrawer(false);
                return;
            }

            switch (e.key) {
                case 'ArrowRight':
                case ' ':
                case 'PageDown':
                case 'ArrowDown':
                    e.preventDefault();
                    nextSlide();
                    break;
                case 'ArrowLeft':
                case 'PageUp':
                case 'ArrowUp':
                case 'Backspace':
                    e.preventDefault();
                    prevSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    goToSlide(0, -1);
                    break;
                case 'End':
                    e.preventDefault();
                    goToSlide(totalSlides - 1, 1);
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    toggleDrawer();
                    break;
                case 'Escape':
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                    break;
            }
        });

        // Edge Click Navigation
        if (navPrev) navPrev.addEventListener('click', prevSlide);
        if (navNext) navNext.addEventListener('click', nextSlide);
        if (arrowPrev) arrowPrev.addEventListener('click', prevSlide);
        if (arrowNext) arrowNext.addEventListener('click', nextSlide);

        // Fullscreen Change Listeners
        document.addEventListener('fullscreenchange', updateFullscreenIcons);
        document.addEventListener('webkitfullscreenchange', updateFullscreenIcons);

        // Fullscreen & Menu Buttons
        if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);
        if (menuBtn) menuBtn.addEventListener('click', () => toggleDrawer(true));
        if (drawerClose) drawerClose.addEventListener('click', () => toggleDrawer(false));
        const counterBadge = document.getElementById('counter-badge');
        if (counterBadge) counterBadge.addEventListener('click', () => toggleDrawer(true));

        // Progress Bar Scrubbing
        if (progressTrack) {
            progressTrack.addEventListener('click', (e) => {
                const rect = progressTrack.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percent = clickX / rect.width;
                const targetIdx = Math.floor(percent * totalSlides);
                goToSlide(Math.max(0, Math.min(totalSlides - 1, targetIdx)));
            });
        }

        // Video Player Controls
        if (slideVideo) {
            slideVideo.addEventListener('click', toggleVideoPlay);
            slideVideo.addEventListener('timeupdate', () => {
                if (slideVideo.duration) {
                    const pct = (slideVideo.currentTime / slideVideo.duration) * 100;
                    if (vSeekFill) vSeekFill.style.width = `${pct}%`;
                    if (vTimeDisplay) {
                        vTimeDisplay.textContent = `${formatTime(slideVideo.currentTime)} / ${formatTime(slideVideo.duration)}`;
                    }
                }
            });
            slideVideo.addEventListener('play', () => updatePlayPauseIcons(true));
            slideVideo.addEventListener('pause', () => updatePlayPauseIcons(false));
            slideVideo.addEventListener('ended', () => {
                updatePlayPauseIcons(false);
            });
        }

        if (vPlayBtn) vPlayBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleVideoPlay();
        });

        if (vMuteBtn) vMuteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (slideVideo) {
                slideVideo.muted = !slideVideo.muted;
                vMuteBtn.style.opacity = slideVideo.muted ? '0.5' : '1';
            }
        });

        if (vSeekBar) {
            vSeekBar.addEventListener('click', (e) => {
                e.stopPropagation();
                if (slideVideo && slideVideo.duration) {
                    const rect = vSeekBar.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    slideVideo.currentTime = pos * slideVideo.duration;
                }
            });
        }

        // Touch Swipe
        let touchStartX = 0;
        window.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;
            if (Math.abs(diff) > 50) {
                if (diff < 0) nextSlide();
                else prevSlide();
            }
        }, { passive: true });

        // URL Hash Change Listener
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#slide-')) {
                const requestedSlide = parseInt(hash.replace('#slide-', ''), 10) - 1;
                if (requestedSlide >= 0 && requestedSlide < totalSlides && requestedSlide !== currentIndex) {
                    goToSlide(requestedSlide, requestedSlide > currentIndex ? 1 : -1);
                }
            }
        });
    }

    // =========================================================================
    // Server Lifecycle & Heartbeat Keep-Alive
    // =========================================================================
    function setupServerLifecycle() {
        if (!window.location.protocol.startsWith('http')) return;

        function sendHeartbeat() {
            try {
                fetch('/api/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slide: currentIndex + 1, time: Date.now() }),
                    keepalive: true
                }).catch(() => {});
            } catch (e) {}
        }

        sendHeartbeat();
        setInterval(sendHeartbeat, 5000);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) sendHeartbeat();
        });
        window.addEventListener('focus', sendHeartbeat);
    }

    // =========================================================================
    // Initialization
    // =========================================================================
    function init() {
        if (!slides.length) {
            console.error('No slides found in SLIDES_MANIFEST!');
            return;
        }

        resizeCanvas();

        // Check URL hash for starting slide (#slide-X)
        const hash = window.location.hash;
        if (hash && hash.startsWith('#slide-')) {
            const requestedSlide = parseInt(hash.replace('#slide-', ''), 10) - 1;
            if (requestedSlide >= 0 && requestedSlide < totalSlides) {
                currentIndex = requestedSlide;
            }
        }

        // Set initial slide image
        activeSlideImg.src = slides[currentIndex].image;
        activeSlideImg.alt = slides[currentIndex].title || `Slide ${currentIndex + 1}`;
        slideStage.style.display = 'flex';
        transitionStage.style.display = 'none';

        if (slides[currentIndex].hasVideo) {
            setupVideoPlayer();
        }

        updateCounter(currentIndex, false);
        updateSlideInfoPill(currentIndex);
        preloadAllImages();
        buildDrawerGrid();
        setupEventListeners();
        setupServerLifecycle();
    }

    // Public API
    window.GoldPresentation = {
        init,
        next: nextSlide,
        prev: prevSlide,
        goTo: goToSlide,
        toggleFullscreen,
        toggleDrawer,
        getCurrentIndex: () => currentIndex,
        getTotalSlides: () => totalSlides
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();


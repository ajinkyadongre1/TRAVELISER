/**
 * MARGIFY — 4K CINEMATIC SCROLL-DRIVEN HERO JOURNEY ENGINE
 * Apple-style canvas scroll visualizer integrating the 240-frame cyber topography &
 * high-altitude expedition animation seamlessly at the top of the homepage.
 */

(function () {
    'use strict';

    const TOTAL_FRAMES = 240;
    const FRAME_DIR = 'journey_frames/';

    // Frame cache: array of HTMLImageElement
    const framesCache = new Array(TOTAL_FRAMES + 1);
    let loadedCount = 0;
    let currentRenderedFrame = 1;
    let targetFrame = 1;
    let scrollProgress = 0;
    let isTicking = false;

    // DOM Elements
    let trackEl, stickyFrameEl, canvas, ctx;
    let heroOverlayEl, stageAlpineEl, stageCoastalEl, stageRevealEl;

    function padNum(n) {
        return String(n).padStart(3, '0');
    }

    function getFrameSrc(n) {
        return `${FRAME_DIR}ezgif-frame-${padNum(n)}.jpg`;
    }

    // Get closest loaded frame to avoid any blank flicker while streaming
    function getBestLoadedFrame(index) {
        if (framesCache[index] && framesCache[index].complete && framesCache[index].naturalWidth > 0) {
            return framesCache[index];
        }
        for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
            const prev = index - offset;
            if (prev >= 1 && framesCache[prev] && framesCache[prev].complete && framesCache[prev].naturalWidth > 0) {
                return framesCache[prev];
            }
            const next = index + offset;
            if (next <= TOTAL_FRAMES && framesCache[next] && framesCache[next].complete && framesCache[next].naturalWidth > 0) {
                return framesCache[next];
            }
        }
        return framesCache[1];
    }

    function drawCover(img) {
        if (!img || !canvas || !ctx) return;
        const cw = canvas.width;
        const ch = canvas.height;
        const iw = img.naturalWidth || 1280;
        const ih = img.naturalHeight || 720;

        const imgRatio = iw / ih;
        const canvasRatio = cw / ch;
        let dw, dh, dx, dy;

        if (canvasRatio > imgRatio) {
            dw = cw;
            dh = cw / imgRatio;
            dx = 0;
            dy = (ch - dh) / 2;
        } else {
            dh = ch;
            dw = ch * imgRatio;
            dx = (cw - dw) / 2;
            dy = 0;
        }

        ctx.drawImage(img, dx, dy, dw, dh);
    }

    function resizeCanvas() {
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        const w = Math.round(rect.width * dpr);
        const h = Math.round(rect.height * dpr);

        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }

        const img = getBestLoadedFrame(Math.round(currentRenderedFrame));
        if (img) drawCover(img);
    }

    function updateScrollState() {
        if (!trackEl) return;
        const rect = trackEl.getBoundingClientRect();
        const scrollableDist = trackEl.offsetHeight - window.innerHeight;

        if (scrollableDist <= 0) {
            scrollProgress = 0;
        } else {
            const scrolled = -rect.top;
            scrollProgress = Math.min(Math.max(scrolled / scrollableDist, 0), 1);
        }

        targetFrame = Math.min(Math.max(Math.round(1 + scrollProgress * (TOTAL_FRAMES - 1)), 1), TOTAL_FRAMES);

        // Update Overlays
        updateUIOverlays(scrollProgress);
    }

    function updateUIOverlays(p) {
        // 1. Hero Content Overlay (#booking-card and hero title):
        // Fully visible at top. Fades smoothly between p=0.03 and p=0.18.
        if (heroOverlayEl) {
            if (p <= 0.02) {
                heroOverlayEl.style.opacity = '1';
                heroOverlayEl.style.transform = 'translateY(0)';
                heroOverlayEl.style.pointerEvents = 'auto';
            } else if (p < 0.18) {
                const fade = (0.18 - p) / 0.16;
                heroOverlayEl.style.opacity = Math.max(fade, 0).toFixed(3);
                heroOverlayEl.style.transform = `translateY(${(-(p - 0.02) * 90).toFixed(1)}px)`;
                heroOverlayEl.style.pointerEvents = fade > 0.3 ? 'auto' : 'none';
            } else {
                heroOverlayEl.style.opacity = '0';
                heroOverlayEl.style.transform = 'translateY(-30px)';
                heroOverlayEl.style.pointerEvents = 'none';
            }
        }

        // 2. Stage Alpine Narrative (~0.24 to ~0.50, peaks at ~0.36)
        if (stageAlpineEl) {
            if (p >= 0.22 && p <= 0.50) {
                let op = 0;
                if (p < 0.30) op = (p - 0.22) / 0.08;
                else if (p > 0.42) op = (0.50 - p) / 0.08;
                else op = 1;
                stageAlpineEl.style.opacity = op.toFixed(3);
                stageAlpineEl.style.transform = `translateY(${((1 - op) * 20).toFixed(1)}px)`;
                stageAlpineEl.style.pointerEvents = op > 0.4 ? 'auto' : 'none';
            } else {
                stageAlpineEl.style.opacity = '0';
                stageAlpineEl.style.pointerEvents = 'none';
            }
        }

        // 3. Stage Coastal Narrative (~0.54 to ~0.78, peaks at ~0.66)
        if (stageCoastalEl) {
            if (p >= 0.54 && p <= 0.78) {
                let op = 0;
                if (p < 0.60) op = (p - 0.54) / 0.06;
                else if (p > 0.72) op = (0.78 - p) / 0.06;
                else op = 1;
                stageCoastalEl.style.opacity = op.toFixed(3);
                stageCoastalEl.style.transform = `translateY(${((1 - op) * 20).toFixed(1)}px)`;
                stageCoastalEl.style.pointerEvents = op > 0.4 ? 'auto' : 'none';
            } else {
                stageCoastalEl.style.opacity = '0';
                stageCoastalEl.style.pointerEvents = 'none';
            }
        }

        // 4. Stage Reveal Narrative (~0.82 to 1.0)
        if (stageRevealEl) {
            if (p >= 0.82) {
                let op = 0;
                if (p < 0.90) op = (p - 0.82) / 0.08;
                else op = 1;
                stageRevealEl.style.opacity = op.toFixed(3);
                stageRevealEl.style.transform = `translateY(${((1 - op) * 20).toFixed(1)}px)`;
                stageRevealEl.style.pointerEvents = op > 0.4 ? 'auto' : 'none';
            } else {
                stageRevealEl.style.opacity = '0';
                stageRevealEl.style.pointerEvents = 'none';
            }
        }

    }

    function onScroll() {
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                updateScrollState();
                isTicking = false;
            });
            isTicking = true;
        }
    }

    function renderLoop() {
        // Butter-smooth lerp towards target frame
        if (Math.abs(currentRenderedFrame - targetFrame) > 0.05) {
            currentRenderedFrame += (targetFrame - currentRenderedFrame) * 0.24;
            const frameNum = Math.min(Math.max(Math.round(currentRenderedFrame), 1), TOTAL_FRAMES);
            const img = getBestLoadedFrame(frameNum);
            if (img) drawCover(img);
        }
        window.requestAnimationFrame(renderLoop);
    }

    // Preload frames progressively in chunks
    function preloadAllFrames() {
        // Frame 1 is loaded immediately
        const firstImg = new Image();
        firstImg.src = getFrameSrc(1);
        framesCache[1] = firstImg;
        firstImg.onload = () => {
            loadedCount++;
            drawCover(firstImg);
        };

        // Load the remaining frames in priority passes
        // Pass 1: Every 5th frame for instant keyframe coverage across the entire journey
        const keyframes = [];
        for (let i = 2; i <= TOTAL_FRAMES; i += 5) {
            keyframes.push(i);
        }

        // Pass 2: Remaining frames
        const restFrames = [];
        for (let i = 2; i <= TOTAL_FRAMES; i++) {
            if (i % 5 !== 0) restFrames.push(i);
        }

        function loadBatch(list, batchSize, onComplete) {
            let idx = 0;
            function nextBatch() {
                if (idx >= list.length) {
                    if (onComplete) onComplete();
                    return;
                }
                const end = Math.min(idx + batchSize, list.length);
                for (let k = idx; k < end; k++) {
                    const fNum = list[k];
                    if (!framesCache[fNum]) {
                        const img = new Image();
                        img.src = getFrameSrc(fNum);
                        img.onload = () => {
                            loadedCount++;
                        };
                        framesCache[fNum] = img;
                    }
                }
                idx = end;
                setTimeout(nextBatch, 40);
            }
            nextBatch();
        }

        loadBatch(keyframes, 12, () => {
            loadBatch(restFrames, 16, null);
        });
    }

    function jumpToStageProgress(prog) {
        if (!trackEl) return;
        const trackTop = trackEl.getBoundingClientRect().top + window.pageYOffset;
        const scrollableDist = trackEl.offsetHeight - window.innerHeight;
        const targetScrollY = trackTop + (prog * scrollableDist);

        window.scrollTo({
            top: targetScrollY,
            behavior: 'smooth'
        });
    }

    function init() {
        trackEl = document.getElementById('hero-scroll-track');
        stickyFrameEl = document.getElementById('hero-sticky-frame');
        canvas = document.getElementById('hero-scroll-canvas');
        if (!canvas || !trackEl) return;

        ctx = canvas.getContext('2d', { alpha: false });

        heroOverlayEl = document.getElementById('hero-content-overlay');
        stageAlpineEl = document.getElementById('narrative-stage-alpine');
        stageCoastalEl = document.getElementById('narrative-stage-coastal');
        stageRevealEl = document.getElementById('narrative-stage-reveal');



        // Click cue scroll to advance
        const cueEl = document.getElementById('hero-scroll-cue');
        if (cueEl) {
            cueEl.addEventListener('click', () => {
                jumpToStageProgress(0.35);
            });
        }

        // Listeners
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', resizeCanvas, { passive: true });

        // Setup size & start preloading
        resizeCanvas();
        preloadAllFrames();
        updateScrollState();

        // Start render animation loop
        window.requestAnimationFrame(renderLoop);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

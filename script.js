// --- Cycling Word ---

// words the cycling element rotates through
const words       = ['syntax', 'grammar', 'structure', 'logic', 'pattern', 'parsing', 'meaning', 'rule'];
const cyclingEl   = document.getElementById('cyclingWord');
const hexChars    = '0123456789ABCDEF'; // character pool for the scramble

let currentIndex   = 0;
let isHovering     = false; // prevents cycling mid-hover
let cycleTimer     = null;
let activeInterval = null;

function toHexAscii(word) {
    return Array.from(word)
        .map(c => c.charCodeAt(0).toString(16).toUpperCase())
        .join(' ');
}

// step-based scramble — reveals characters left-to-right as iterations increase
function scrambleTo(target, finalText, callback) {
    if (activeInterval) clearInterval(activeInterval);
    const finalLen   = finalText.length;
    let iterations   = 0;
    const totalSteps = 10 + finalLen;

    activeInterval = setInterval(() => {
        let display = '';
        for (let i = 0; i < finalLen; i++) {
            const revealAt = totalSteps - finalLen + i; // left-to-right reveal threshold
            if (iterations >= revealAt) {
                display += finalText[i];
            } else {
                display += hexChars[Math.floor(Math.random() * hexChars.length)];
            }
        }
        target.textContent = display;
        iterations++;

        if (iterations > totalSteps) { // snap to final string and fire callback
            clearInterval(activeInterval);
            activeInterval = null;
            target.textContent = finalText;
            if (callback) callback();
        }
    }, 35);
}

function startCycleTimer() {
    stopCycleTimer();
    cycleTimer = setInterval(() => {
        if (isHovering) return;
        currentIndex = (currentIndex + 1) % words.length;
        scrambleTo(cyclingEl, words[currentIndex], null);
    }, 2200);
}

function stopCycleTimer() {
    if (cycleTimer) {
        clearInterval(cycleTimer);
        cycleTimer = null;
    }
}

// on mouseenter: scramble to hex ASCII and stop cycling
// on mouseleave: scramble back to the word, then resume cycling
cyclingEl.addEventListener('mouseenter', () => {
    isHovering = true;
    stopCycleTimer();
    if (activeInterval) { clearInterval(activeInterval); activeInterval = null; }
    scrambleTo(cyclingEl, toHexAscii(words[currentIndex]), null);
});

cyclingEl.addEventListener('mouseleave', () => {
    if (activeInterval) { clearInterval(activeInterval); activeInterval = null; }
    scrambleTo(cyclingEl, words[currentIndex], () => {
        isHovering = false;
        startCycleTimer();
    });
});

startCycleTimer();


// --- Animated Graph ---

const canvas = document.getElementById('heroGraph');
const ctx    = canvas.getContext('2d');

let width, height, time = 0;

// expanded layout: 15 nodes across 3 rings (inner 6, mid 5, outer fringe 3) + hub
// nodes defined by relative position (rx, ry as fractions of graphBox), radius, opacity
const nodeLayout = [
    { id: 0,  rx: 0.48, ry: 0.48, r: 8,   opacity: 0.9  },
    { id: 1,  rx: 0.30, ry: 0.28, r: 5,   opacity: 0.7  },
    { id: 2,  rx: 0.62, ry: 0.22, r: 4.5, opacity: 0.6  },
    { id: 3,  rx: 0.75, ry: 0.45, r: 5.5, opacity: 0.65 },
    { id: 4,  rx: 0.68, ry: 0.72, r: 4.5, opacity: 0.6  },
    { id: 5,  rx: 0.38, ry: 0.75, r: 5,   opacity: 0.7  },
    { id: 6,  rx: 0.20, ry: 0.55, r: 4,   opacity: 0.55 },
    { id: 7,  rx: 0.12, ry: 0.20, r: 4,   opacity: 0.45 },
    { id: 8,  rx: 0.82, ry: 0.28, r: 3.5, opacity: 0.4  },
    { id: 9,  rx: 0.90, ry: 0.62, r: 3.5, opacity: 0.4  },
    { id: 10, rx: 0.55, ry: 0.92, r: 3.5, opacity: 0.42 },
    { id: 11, rx: 0.08, ry: 0.78, r: 4,   opacity: 0.45 },
    { id: 12, rx: 0.42, ry: 0.05, r: 3,   opacity: 0.3  },
    { id: 13, rx: 0.95, ry: 0.48, r: 2.5, opacity: 0.25 },
    { id: 14, rx: 0.18, ry: 0.95, r: 3,   opacity: 0.3  },
];

// [from, to, opacity] — inner ring now fully mesh-connected
const edges = [
    [0, 1, 0.35], [0, 2, 0.30], [0, 3, 0.35], [0, 4, 0.30], [0, 5, 0.35], [0, 6, 0.30],
    [1, 2, 0.22], [2, 3, 0.20], [3, 4, 0.20], [4, 5, 0.22], [5, 6, 0.20], [6, 1, 0.18],
    [1, 7, 0.18], [2, 8, 0.16], [3, 9, 0.18], [4, 10, 0.16], [5, 11, 0.18], [6, 11, 0.15],
    [7, 8, 0.14], [9, 10, 0.14], [10, 11, 0.14],
    [7, 12, 0.12], [8, 12, 0.10], [9, 13, 0.12], [11, 14, 0.12], [10, 14, 0.10],
];

// each node gets independent sine-wave drift on x and y — unique speed, phase, amplitude
// drift amplitude reduced vs v9 (3/2.5 instead of 4/3) to keep the denser graph tighter
const drifts = nodeLayout.map((_, i) => ({
    speedX: 0.15 + (i * 0.07) % 0.30,
    speedY: 0.12 + (i * 0.09) % 0.25,
    phaseX: i * 1.1,
    phaseY: i * 0.8 + 0.5,
    ampX:   3 + (i % 3) * 1.5,
    ampY:   2.5 + (i % 4) * 1,
}));

// bounding box tighter than v9 (0.26/0.48 vs 0.32/0.55) — graph stays left without overflowing
const graphBox = { x: 0, y: 0, w: 0, h: 0 };

function resize() {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
    graphBox.w = Math.min(width * 0.26, 320);
    graphBox.h = Math.min(height * 0.48, 370);
    graphBox.x = width * 0.05;
    graphBox.y = (height - graphBox.h) / 2;
}

// combines base position, global breathe (slow sine scale from center), and per-node drift
function getNodePos(node) {
    const d       = drifts[node.id];
    const breathe = Math.sin(time * 0.6) * 0.04 + 1;
    const cx      = graphBox.x + graphBox.w * 0.5;
    const cy      = graphBox.y + graphBox.h * 0.5;
    const baseX   = graphBox.x + node.rx * graphBox.w;
    const baseY   = graphBox.y + node.ry * graphBox.h;
    const dx      = (baseX - cx) * breathe + cx;
    const dy      = (baseY - cy) * breathe + cy;
    const ox      = Math.sin(time * d.speedX + d.phaseX) * d.ampX;
    const oy      = Math.sin(time * d.speedY + d.phaseY) * d.ampY;
    return { x: dx + ox, y: dy + oy };
}

function drawGraph() {
    ctx.clearRect(0, 0, width, height);
    const positions = nodeLayout.map(n => getNodePos(n));

    edges.forEach(([from, to, opacity]) => {
        const a = positions[from];
        const b = positions[to];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(0, 0, 255, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    nodeLayout.forEach((node, i) => {
        const pos   = positions[i];
        const pulse = node.id === 0 ? Math.sin(time * 1.2) * 0.15 + 0.85 : 1; // central node pulses

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 255, ${node.opacity})`;
        ctx.fill();

        if (node.id === 0) { // soft glow ring on central node
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, node.r * 2.5 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 255, 0.07)';
            ctx.fill();
        }
    });
}

function animate() {
    time += 0.016;
    drawGraph();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
resize();
animate();
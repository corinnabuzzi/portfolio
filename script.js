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

// coordinate system switch from v10: nodes now defined in polar coordinates
// (angle in radians, dist in px from center) instead of relative rx/ry fractions of a bounding box
// makes ring-based layouts much easier to reason about and tweak
const nodes = [
    { id: 0,  angle: 0,    dist: 0,   r: 8,   opacity: 0.9  }, // hub
    { id: 1,  angle: 0.4,  dist: 62,  r: 5,   opacity: 0.7  }, // inner ring
    { id: 2,  angle: 1.15, dist: 70,  r: 4.5, opacity: 0.6  },
    { id: 3,  angle: 1.85, dist: 58,  r: 5.5, opacity: 0.65 },
    { id: 4,  angle: 3.1,  dist: 75,  r: 4.5, opacity: 0.6  },
    { id: 5,  angle: 4.2,  dist: 65,  r: 5,   opacity: 0.7  },
    { id: 6,  angle: 5.4,  dist: 72,  r: 4,   opacity: 0.55 },
    { id: 7,  angle: 0.85, dist: 125, r: 4,   opacity: 0.45 }, // mid ring
    { id: 8,  angle: 1.55, dist: 118, r: 3.5, opacity: 0.4  },
    { id: 9,  angle: 2.7,  dist: 132, r: 3.5, opacity: 0.4  },
    { id: 10, angle: 3.8,  dist: 120, r: 3.5, opacity: 0.42 },
    { id: 11, angle: 5.0,  dist: 128, r: 4,   opacity: 0.45 },
    { id: 12, angle: 0.15, dist: 175, r: 3,   opacity: 0.3  }, // outer fringe
    { id: 13, angle: 2.2,  dist: 168, r: 2.5, opacity: 0.25 },
    { id: 14, angle: 3.5,  dist: 185, r: 3,   opacity: 0.3  },
    { id: 15, angle: 5.6,  dist: 162, r: 2.5, opacity: 0.25 },
];

// [from, to, opacity] — inner ring has cross-edges (1→3, 4→6) for extra density
const edges = [
    [0, 1, 0.35], [0, 2, 0.30], [0, 3, 0.35], [0, 4, 0.30], [0, 5, 0.35], [0, 6, 0.30],
    [1, 2, 0.22], [2, 3, 0.24], [3, 4, 0.20], [4, 5, 0.22], [5, 6, 0.20], [6, 1, 0.18],
    [1, 3, 0.12], [4, 6, 0.12],
    [1, 7, 0.18], [2, 7, 0.14], [2, 8, 0.16], [3, 9, 0.18], [5, 10, 0.16], [5, 11, 0.18], [6, 11, 0.15],
    [7, 8, 0.14], [9, 10, 0.14], [10, 11, 0.13],
    [1, 12, 0.10], [3, 13, 0.10], [4, 14, 0.10], [6, 15, 0.10],
    [7, 12, 0.12], [8, 13, 0.10], [10, 14, 0.12], [11, 15, 0.12],
];

// each node gets independent sine-wave drift on x and y — unique speed, phase, amplitude
const drifts = nodes.map((_, i) => ({
    speedX: 0.15 + (i * 0.07) % 0.30,
    speedY: 0.12 + (i * 0.09) % 0.25,
    phaseX: i * 1.1,
    phaseY: i * 0.8 + 0.5,
    ampX:   3 + (i % 3) * 1.5,
    ampY:   2.5 + (i % 4) * 1,
}));

// graph anchored to left side of viewport at 18% width, vertically centered
let centerX = 0, centerY = 0;

function resize() {
    width   = canvas.width  = window.innerWidth;
    height  = canvas.height = window.innerHeight;
    centerX = width * 0.18;
    centerY = height * 0.5;
}

// polar → cartesian conversion with breathe scale and per-node drift
function getNodePos(node) {
    const d       = drifts[node.id];
    const breathe = Math.sin(time * 0.6) * 0.04 + 1;
    const dist    = node.dist * breathe;
    const baseX   = centerX + Math.cos(node.angle) * dist;
    const baseY   = centerY + Math.sin(node.angle) * dist;
    const ox      = Math.sin(time * d.speedX + d.phaseX) * d.ampX;
    const oy      = Math.sin(time * d.speedY + d.phaseY) * d.ampY;
    return { x: baseX + ox, y: baseY + oy };
}

function drawGraph() {
    ctx.clearRect(0, 0, width, height);
    const positions = nodes.map(n => getNodePos(n));

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

    nodes.forEach((node, i) => {
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
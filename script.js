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


// --- Graph ---

const canvas = document.getElementById('heroGraph');
const ctx    = canvas.getContext('2d');

let width, height, time = 0;

// nodes defined by relative position (rx, ry as fractions of graphBox), radius, opacity
const nodeLayout = [
    { id: 0, rx: 0.50, ry: 0.50, r: 8,   opacity: 0.9  },
    { id: 1, rx: 0.28, ry: 0.30, r: 5,   opacity: 0.7  },
    { id: 2, rx: 0.72, ry: 0.25, r: 4,   opacity: 0.55 },
    { id: 3, rx: 0.80, ry: 0.55, r: 5.5, opacity: 0.65 },
    { id: 4, rx: 0.60, ry: 0.82, r: 4.5, opacity: 0.6  },
    { id: 5, rx: 0.22, ry: 0.72, r: 5,   opacity: 0.7  },
    { id: 6, rx: 0.10, ry: 0.18, r: 3.5, opacity: 0.4  },
    { id: 7, rx: 0.92, ry: 0.40, r: 3,   opacity: 0.35 },
    { id: 8, rx: 0.38, ry: 0.95, r: 3.5, opacity: 0.4  },
    { id: 9, rx: 0.05, ry: 0.52, r: 3,   opacity: 0.3  },
];

// [from, to, opacity]
const edges = [
    [0, 1, 0.35], [0, 2, 0.30], [0, 3, 0.35], [0, 4, 0.30], [0, 5, 0.35],
    [1, 2, 0.20], [2, 3, 0.18], [4, 5, 0.20], [1, 5, 0.15],
    [1, 6, 0.15], [6, 9, 0.12], [3, 7, 0.15], [4, 8, 0.12], [5, 9, 0.15],
];

// each node gets independent sine-wave drift on x and y — unique speed, phase, amplitude
const drifts = nodeLayout.map((_, i) => ({
    speedX: 0.15 + (i * 0.07) % 0.30,
    speedY: 0.12 + (i * 0.09) % 0.25,
    phaseX: i * 1.1,
    phaseY: i * 0.8 + 0.5,
    ampX:   4 + (i % 3) * 2,
    ampY:   3 + (i % 4) * 1.5,
}));

// bounding box anchored to the left side of the viewport
const graphBox = { x: 0, y: 0, w: 0, h: 0 };

function resize() {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
    graphBox.w = Math.min(width * 0.32, 380);
    graphBox.h = Math.min(height * 0.55, 420);
    graphBox.x = width * 0.06;
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
// --- Cycling Word ---

// words the cycling element rotates through
const words = ['syntax', 'grammar', 'structure', 'logic', 'pattern', 'parsing', 'meaning', 'rule'];
const cyclingEl = document.getElementById('cyclingWord');
const hexChars = '0123456789ABCDEF'; // character pool for the scramble

let currentIndex = 0;
let isHovering = false; // prevents cycling mid-hover
let cycleTimer = null;
let activeInterval = null;

function toHexAscii(word) {
    return Array.from(word).map(c => c.charCodeAt(0).toString(16).toUpperCase()).join(' ');
}

// step-based scramble — reveals characters left-to-right as iterations increase
function scrambleTo(target, finalText, callback) {
    if (activeInterval) clearInterval(activeInterval);
    const finalLen = finalText.length;
    let iterations = 0;
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

startCycleTimer();

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


// --- Animated Graph (Obsidian-style) ---

const canvas = document.getElementById('heroGraph');
const graphCtx = canvas.getContext('2d');

const BLUE = '#0000FF';

// generates the full node + edge set procedurally around a center point
// three node kinds: center (hub), secondary (5 mid-ring), leaf (32 outer, distributed across 4 radial bands)
// edges also generated here — graph looks slightly different on each load
function buildGraph(cx, cy) {
    const nodes = [];
    const edges = [];
    let id = 0;

    const secondaryCount = 5;
    const secondaryRadius = 140; // expanded from v12's 80
    const leafCount = 32;
    const leafBands = [220, 260, 290, 315]; // expanded from v12's [130, 155, 172, 185]

    nodes.push({
        id: id++, x: cx, y: cy, r: 9, kind: 'center',
        phaseX: 0, phaseY: 0, speedX: 0.0007, speedY: 0.0009, driftAmp: 2,
    });

    for (let i = 0; i < secondaryCount; i++) {
        const angle = (i / secondaryCount) * Math.PI * 2 + 0.4;
        const r     = secondaryRadius + (Math.random() * 20 - 10);
        nodes.push({
            id: id++, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r,
            r: 5.5, kind: 'secondary',
            phaseX: Math.random() * Math.PI * 2, phaseY: Math.random() * Math.PI * 2,
            speedX: 0.0005 + Math.random() * 0.0004, speedY: 0.0005 + Math.random() * 0.0004,
            driftAmp: 3 + Math.random() * 2,
        });
    }

    for (let i = 0; i < leafCount; i++) {
        const band = leafBands[i % leafBands.length];
        const angle = (i / leafCount) * Math.PI * 2 + (Math.random() * 0.18 - 0.09);
        const radialJitter = band + (Math.random() * 22 - 11);
        const clampedR = Math.min(radialJitter, 330); // hard cap expanded from 195
        nodes.push({
            id: id++, x: cx + Math.cos(angle) * clampedR, y: cy + Math.sin(angle) * clampedR,
            r: 2.5 + Math.random() * 1.5, kind: 'leaf',
            phaseX: Math.random() * Math.PI * 2, phaseY: Math.random() * Math.PI * 2,
            speedX: 0.0003 + Math.random() * 0.0005, speedY: 0.0003 + Math.random() * 0.0005,
            driftAmp: 4 + Math.random() * 4,
        });
    }

    // center to all secondaries
    for (let i = 1; i <= secondaryCount; i++) {
        edges.push({ a: 0, b: i, opacity: 0.14 });
    }

    // each secondary connects to its slice of leaves + adjacent secondary (ring mesh)
    const leafStart = secondaryCount + 1;
    const leavesPerSecondary = Math.floor(leafCount / secondaryCount);

    for (let s = 0; s < secondaryCount; s++) {
        const sId  = 1 + s;
        const base = leafStart + s * leavesPerSecondary;
        for (let l = 0; l < leavesPerSecondary + 1; l++) {
            const lId = base + l;
            if (lId < nodes.length) edges.push({ a: sId, b: lId, opacity: 0.1 });
        }
        const nextS = 1 + ((s + 1) % secondaryCount);
        edges.push({ a: sId, b: nextS, opacity: 0.12 });
    }

    // random leaf-to-leaf edges fill the silhouette
    for (let l = leafStart; l < nodes.length - 1; l++) {
        if (Math.random() < 0.45) {
            const target = l + 1 + Math.floor(Math.random() * 3);
            if (target < nodes.length) edges.push({ a: l, b: target, opacity: 0.08 });
        }
    }

    // a few center-to-leaf shortcuts for extra density
    for (let i = 0; i < 6; i++) {
        const lId = leafStart + Math.floor(Math.random() * leafCount);
        edges.push({ a: 0, b: lId, opacity: 0.08 });
    }

    return { nodes, edges };
}

let graphData = null;
let graphW = 0, graphH = 0, graphDpr = 1;

// DPR-aware resize — canvas sized at physical pixels, drawn at logical pixels via setTransform
// graph anchor moved to right side: cx = graphW * 0.68
function resizeGraph() {
    graphDpr = window.devicePixelRatio || 1;
    graphW = canvas.offsetWidth  || window.innerWidth;
    graphH = canvas.offsetHeight || window.innerHeight;
    canvas.width = graphW * graphDpr;
    canvas.height = graphH * graphDpr;
    graphData = buildGraph(graphW * 0.68, graphH * 0.5);
}

resizeGraph();
const graphStartTime = performance.now();

function drawGraph(now) {
    const elapsed = now - graphStartTime;
    if (!graphData) { requestAnimationFrame(drawGraph); return; }

    const cx = graphW * 0.68; // right-side anchor to pair with left-aligned hero content
    const cy = graphH * 0.5;

    graphCtx.setTransform(graphDpr, 0, 0, graphDpr, 0, 0);
    graphCtx.clearRect(0, 0, graphW, graphH);

    // slow global breathe — all nodes scale slightly in and out together
    const breathScale = 1 + 0.018 * Math.sin((elapsed / 4000) * Math.PI * 2);

    const positions = graphData.nodes.map(function(n) {
        const driftX = n.driftAmp * Math.sin(elapsed * n.speedX + n.phaseX);
        const driftY = n.driftAmp * Math.sin(elapsed * n.speedY + n.phaseY);
        const baseX  = cx + (n.x - cx) * breathScale;
        const baseY  = cy + (n.y - cy) * breathScale;
        return { x: baseX + driftX, y: baseY + driftY };
    });

    for (let i = 0; i < graphData.edges.length; i++) {
        const edge = graphData.edges[i];
        const pa = positions[edge.a];
        const pb = positions[edge.b];
        graphCtx.beginPath();
        graphCtx.moveTo(pa.x, pa.y);
        graphCtx.lineTo(pb.x, pb.y);
        graphCtx.strokeStyle = 'rgba(0,0,255,' + edge.opacity + ')';
        graphCtx.lineWidth = 0.5;
        graphCtx.stroke();
    }

    for (let i = 0; i < graphData.nodes.length; i++) {
        const node = graphData.nodes[i];
        const pos = positions[i];
        const r = node.r * breathScale;

        if (node.kind === 'center') {
            // animated radial gradient glow that pulses independently of breathe
            var pulse = 0.5 + 0.5 * Math.sin((elapsed / 1800) * Math.PI * 2);
            var glowR = r * (2.8 + pulse * 1.6);
            var grd   = graphCtx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowR);
            grd.addColorStop(0,   'rgba(0,0,255,' + (0.22 + pulse * 0.1)  + ')');
            grd.addColorStop(0.4, 'rgba(0,0,255,' + (0.08 + pulse * 0.04) + ')');
            grd.addColorStop(1,   'rgba(0,0,255,0)');
            graphCtx.beginPath();
            graphCtx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
            graphCtx.fillStyle = grd;
            graphCtx.fill();

            graphCtx.beginPath();
            graphCtx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
            graphCtx.fillStyle = BLUE;
            graphCtx.fill();

        } else if (node.kind === 'secondary') {
            // soft static glow ring + solid fill at 85% opacity
            var grd2 = graphCtx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 2.5);
            grd2.addColorStop(0, 'rgba(0,0,255,0.15)');
            grd2.addColorStop(1, 'rgba(0,0,255,0)');
            graphCtx.beginPath();
            graphCtx.arc(pos.x, pos.y, r * 2.5, 0, Math.PI * 2);
            graphCtx.fillStyle = grd2;
            graphCtx.fill();

            graphCtx.beginPath();
            graphCtx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
            graphCtx.fillStyle = BLUE;
            graphCtx.globalAlpha = 0.85;
            graphCtx.fill();
            graphCtx.globalAlpha = 1;

        } else {
            // leaves: plain fill at 60% opacity
            graphCtx.beginPath();
            graphCtx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
            graphCtx.fillStyle = BLUE;
            graphCtx.globalAlpha = 0.6;
            graphCtx.fill();
            graphCtx.globalAlpha = 1;
        }
    }

    requestAnimationFrame(drawGraph);
}

window.addEventListener('resize', resizeGraph);
requestAnimationFrame(drawGraph);
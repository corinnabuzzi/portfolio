// words the cycling element rotates through
const words      = ['syntax', 'grammar', 'structure', 'logic', 'pattern', 'parsing', 'meaning', 'rule'];
const cyclingEl  = document.getElementById('cyclingWord');
const hexChars   = '0123456789ABCDEF'; // character pool for the scramble

let currentIndex   = 0;
let isHovering     = false; // prevents cycling mid-hover
let cycleTimer     = null;
let activeInterval = null;

function toHexAscii(word) {
    return Array.from(word)
        .map(c => c.charCodeAt(0).toString(16).toUpperCase())
        .join(' ');
}

// step-based scramble (contrast with decodeAnimate in v7 which was time-based)
// reveals characters left-to-right as iterations increase
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
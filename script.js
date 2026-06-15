// words the cycling element rotates through
const words   = ['syntax', 'grammar', 'structure', 'logic', 'pattern', 'parsing', 'meaning', 'rule'];
const GLYPHS  = '0123456789ABCDEF<>=+*{}[]_'; // character pool for the decode scramble (hex-ish on purpose)

let wordIndex = 0;
let wordTimer = null;
let decoding  = false; // prevents hover trigger mid-animation
let decodeIv  = null;

const wordEl   = document.getElementById('cycling-word');
const hoverCue = document.getElementById('hover-cue'); // the "hover to decode" label

// time-based scramble (contrast with glitchText which is step-based)
// p = progress 0→1 over DUR ms; characters resolve left-to-right as p increases
// adds .decoding class during animation (switches font to mono in CSS)
function decodeAnimate(el, target, onDone) {
    const DUR   = 680;
    const start = Date.now();
    el.classList.add('decoding');

    const iv = setInterval(() => {
        const p   = Math.min(1, (Date.now() - start) / DUR);
        let out   = '';
        for (let i = 0; i < target.length; i++) {
            const threshold = (i / target.length) * 0.8;
            if (p >= threshold + 0.2) out += target[i]; // this character is ready to lock in
            else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        el.textContent = out;
        if (p >= 1) { // done — snap to final string and fire callback
            clearInterval(iv);
            el.classList.remove('decoding');
            el.textContent = target;
            if (onDone) onDone();
        }
    }, 40);

    return iv; // returned so it can be cleared externally if needed (e.g. on reset)
}

// sets word text and triggers the CSS fade-in transition
// double rAF needed to let the browser register the class removal before re-adding
function showWord(el, word) {
    el.classList.remove('exit');
    el.textContent = word;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
}

// slides current word out, waits 380ms (exit transition), then shows next
function nextWord() {
    if (decoding) return; // don't cycle mid-hover
    wordEl.classList.add('exit');
    wordEl.classList.remove('visible');
    setTimeout(() => {
        wordIndex = (wordIndex + 1) % words.length;
        showWord(wordEl, words[wordIndex]);
    }, 380);
}

// on hover: decode current word to its hex ASCII representation, hold, then decode back
// e.g. 'syntax' → '73 79 6E 74 61 78' → 'syntax'
wordEl.parentElement.addEventListener('mouseenter', () => {
    if (!wordEl.classList.contains('visible') || decoding) return;
    decoding = true;
    hoverCue.classList.remove('visible');

    const currentWord = words[wordIndex];
    const hexTarget   = [...currentWord]
        .map(c => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
        .join(' ');

    decodeIv = decodeAnimate(wordEl, hexTarget, () => {
        setTimeout(() => { // 400ms hold on the hex before decoding back
            decodeIv = decodeAnimate(wordEl, currentWord, () => {
                decoding = false;
                hoverCue.classList.add('visible');
            });
        }, 400);
    });
});

// reset + orchestrate the entrance sequence
function runSequence() {
    if (wordTimer) clearInterval(wordTimer);
    if (decodeIv)  clearInterval(decodeIv);

    wordIndex = 0;
    decoding  = false;

    const nameEl    = document.getElementById('name');
    const roleEl    = document.getElementById('role');
    const taglineEl = document.getElementById('tagline');
    const navEl     = document.getElementById('nav');

    // reset all animated elements before running
    wordEl.classList.remove('visible', 'exit', 'decoding');
    wordEl.textContent = '';
    hoverCue.classList.remove('visible');
    nameEl.classList.remove('revealed');
    roleEl.classList.remove('visible');
    taglineEl.classList.remove('visible');
    navEl.classList.remove('visible');

    setTimeout(() => showWord(wordEl, words[0]),          200);
    setTimeout(() => nameEl.classList.add('revealed'),    900);
    setTimeout(() => roleEl.classList.add('visible'),    1400);
    setTimeout(() => taglineEl.classList.add('visible'), 1800);
    setTimeout(() => {
        navEl.classList.add('visible');
        hoverCue.classList.add('visible');
    }, 2200);
    setTimeout(() => {
        wordTimer = setInterval(nextWord, 2200); // start cycling after everything's settled
    }, 2600);
}

runSequence();
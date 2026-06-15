// words the cycling element rotates through
const words   = ['syntax', 'grammar', 'structure', 'logic', 'pattern', 'parsing', 'meaning', 'rule'];
const GLYPHS  = '0123456789ABCDEF<>=+*{}[]_';

let wordIndex = 0;
let wordTimer = null;
let decoding  = false;
let decodeIv  = null;

const wordEl   = document.getElementById('cycling-word');
const hoverCue = document.getElementById('hover-cue');

// time-based scramble; characters resolve left-to-right as p (progress 0→1) increases
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
            if (p >= threshold + 0.2) out += target[i];
            else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        el.textContent = out;
        if (p >= 1) {
            clearInterval(iv);
            el.classList.remove('decoding');
            el.textContent = target;
            if (onDone) onDone();
        }
    }, 40);

    return iv;
}

// sets word text and triggers CSS fade-in
// double rAF needed to let the browser register class removal before re-adding
function showWord(el, word) {
    el.classList.remove('exit');
    el.textContent = word;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
}

// slides current word out, waits 380ms (exit transition), then shows next
function nextWord() {
    if (decoding) return;
    wordEl.classList.add('exit');
    wordEl.classList.remove('visible');
    setTimeout(() => {
        wordIndex = (wordIndex + 1) % words.length;
        showWord(wordEl, words[wordIndex]);
    }, 380);
}

// on hover: decode current word to hex ASCII, hold 400ms, decode back
wordEl.parentElement.addEventListener('mouseenter', () => {
    if (!wordEl.classList.contains('visible') || decoding) return;
    decoding = true;
    hoverCue.classList.remove('visible');

    const currentWord = words[wordIndex];
    const hexTarget   = [...currentWord]
        .map(c => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
        .join(' ');

    decodeIv = decodeAnimate(wordEl, hexTarget, () => {
        setTimeout(() => {
            decodeIv = decodeAnimate(wordEl, currentWord, () => {
                decoding = false;
                hoverCue.classList.add('visible');
            });
        }, 400);
    });
});

// start cycling immediately on load
setTimeout(() => {
    showWord(wordEl, words[0]);
    hoverCue.classList.add('visible');
    setTimeout(() => {
        wordTimer = setInterval(nextWord, 2200);
    }, 2400);
}, 200);
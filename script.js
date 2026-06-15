// character pool for the glitch scramble: lowercase letters + punctuation used in the mono block
const CHARS = 'abcdefghijklmnopqrstuvwxyz_()→.';

// an array of arrays — 4, one per line of the mono block.
// each inner array is a line broken into tokens: chunks that need independent styling or animation.
// token properties: text (displayed on load), cls (color class), morphsTo (optional — glitches into this string after delay)
const lineData = [
    [
        { text: 'reading',          cls: 'blue', morphsTo: 'parsing'      },
        { text: '(',                cls: 'dim'                             },
        { text: 'natural_language', cls: 'blue', morphsTo: 'morphology'   },
        { text: ')',                cls: 'dim'                             },
    ],
    [
        { text: 'grammar',          cls: 'blue', morphsTo: 'syntax_tree'  },
        { text: ' → ',              cls: 'dim'                             },
        { text: 'meaning',          cls: 'blue', morphsTo: 'structure'    },
    ],
    [
        { text: 'found:',           cls: 'dim'                             },
        { text: ' convergence',     cls: 'blue', morphsTo: ' pattern'     },
        { text: '(linguistics',     cls: 'dim'                             },
        { text: ', cs)',            cls: 'dim'                             },
    ],
    [
        { text: 'resolve',          cls: 'blue'                            },
        { text: '(',                cls: 'dim'                             },
        { text: '"Corinna Buzzi"',  cls: 'blue'                            },
        { text: ') →',              cls: 'dim'                             },
    ],
];

const MORPH_DELAY    = 2200; // ms after load before tokens start morphing
const MORPH_DURATION = 600;  // duration of each individual glitch animation
const MORPH_STEPS    = 12;

// step-based scramble — fires `steps` times over `duration`ms
// characters resolve left-to-right as progress increases
// punctuation left untouched throughout (scrambling a paren looks wrong)
function glitchText(el, targetText, duration, steps) {
    let step = 0;
    const iv = setInterval(() => {
        step++;
        const progress = step / steps;
        const chars = targetText.split('').map((ch, i) => {
            if (progress > i / targetText.length + 0.2) return ch; // left-to-right reveal threshold
            if (' ()→."_:,'.includes(ch)) return ch;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
        });
        el.textContent = chars.join('');
        if (step >= steps) { // snap to final string on last frame
            clearInterval(iv);
            el.textContent = targetText;
        }
    }, duration / steps);
}

// replays the glitch on mouseenter of the parent .mono-line
// `running` prevents retriggering mid-animation
function attachHoverGlitch(el, text) {
    let running = false;
    el.closest('.mono-line').addEventListener('mouseenter', () => {
        if (running) return;
        running = true;
        glitchText(el, text, 400, 10);
        setTimeout(() => { running = false; }, 600);
    });
}

let roleTimer   = null;
let currentRole = 0;

function runSequence() {
    const monoBlock  = document.getElementById('mono-block');
    const nameEl     = document.getElementById('name');
    const rolesStack = document.getElementById('roles-stack');
    const taglineEl  = document.getElementById('tagline');
    const navEl      = document.getElementById('nav');

    // reset everything before running — matters if replay gets added later
    monoBlock.innerHTML = '';
    nameEl.classList.remove('revealed');
    taglineEl.classList.remove('visible');
    navEl.classList.remove('visible');

    if (roleTimer) clearInterval(roleTimer);
    currentRole = 0;

    const roleEls = rolesStack.querySelectorAll('.role-item');
    roleEls.forEach(el => el.classList.remove('visible', 'active', 'inactive'));

    // lines built dynamically so morph timers can reference the actual DOM spans
    lineData.forEach((tokens, li) => {
        const line = document.createElement('div');
        line.className = 'mono-line';

        tokens.forEach(tok => {
            const span = document.createElement('span');
            span.className = 'token ' + (tok.cls || '');
            span.textContent = tok.text;
            line.appendChild(span);

            if (tok.morphsTo) {
                // glitch to final word after delay, then attach hover replay
                setTimeout(() => {
                    glitchText(span, tok.morphsTo, MORPH_DURATION, MORPH_STEPS);
                    setTimeout(() => attachHoverGlitch(span, tok.morphsTo), MORPH_DURATION + 100);
                }, MORPH_DELAY + li * 80); // stagger per line so they don't all fire at once
            } else {
                // no morph — just attach hover glitch directly
                setTimeout(() => {
                    attachHoverGlitch(span, tok.text);
                }, MORPH_DELAY + MORPH_DURATION + 200);
            }
        });

        monoBlock.appendChild(line);
        setTimeout(() => line.classList.add('visible'), li * 260 + 150); // 260ms stagger per line
    });

    // name wipes in left-to-right via clip-path (see CSS)
    setTimeout(() => nameEl.classList.add('revealed'), 1700);

    // all three role items fade in together; active one highlighted in blue
    // cycles every 2000ms indefinitely (no stop — contrast with the v5 single-role version)
    setTimeout(() => {
        roleEls.forEach((el, i) => {
            el.classList.add('visible');
            el.classList.add(i === 0 ? 'active' : 'inactive');
        });

        roleTimer = setInterval(() => {
            const prev = currentRole;
            currentRole = (currentRole + 1) % roleEls.length;
            roleEls[prev].classList.replace('active', 'inactive');
            roleEls[currentRole].classList.replace('inactive', 'active');
        }, 2000);
    }, 2100);

    setTimeout(() => taglineEl.classList.add('visible'), 2600);
    setTimeout(() => navEl.classList.add('visible'), 3100);
}

runSequence();
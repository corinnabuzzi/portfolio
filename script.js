// const holding characters that the tokens in the mono block morph *into* after glitch animation
const CHARS = 'abcdefghijklmnopqrstuvwxyz_()→.';

// an array of arrays! 4, one per line of the mono block. 
// inner arrays broken into **tokens**, the chunks of text that need to be independently rteferenced for styling or animation
// each token 3 properities: text - displayed; cls - color class; morphTo - if present this token glitches into that string
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

const MORPH_DELAY    = 2200; 
const MORPH_DURATION = 600;
const MORPH_STEPS    = 12;

// glitchText makes scramble animation (=word made of random characters that progressively stick and lock into the real letters; left to right)
// the `setInterval` fires `steps` times over `duration` milliseconds
//for each `i`, check charactert progress. yes? show the real character, no? show a random one from CHARS 
function glitchText(el, targetText, duration, steps) {
    let step = 0;
    const iv = setInterval(() => {
        step++;
        const progress = step / steps;
        const chars = targetText.split('').map((ch, i) => {
            if (progress > i / targetText.length + 0.2) return ch; // this is the "left to right"
            if (' ()→."_:,'.includes(ch)) return ch;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
        });
        el.textContent = chars.join('');
        if (step >= steps) { // interval clears itself as error management 
            clearInterval(iv);
            el.textContent = targetText;
        }
    }, duration / steps);
}

// replays the glitch on mouse hover of the parent .mono-line
function attachHoverGlitch(el, text) {
    let running = false; // ruynning = prevents retrigger midway
    el.closest('.mono-line').addEventListener('mouseenter', () => {
        if (running) return;
        running = true;
        glitchText(el, text, 400, 10);
        setTimeout(() => { running = false; }, 600);
    });
}

const roles = [
    'junior software developer',
    'former linguistics student',
    'learning in public',
];

let roleIndex = 0;
let roleCycle = null;

function runSequence() {
    const container = document.getElementById('mono-lines');
    const nameEl    = document.getElementById('name');
    const roleEl    = document.getElementById('role');
    const taglineEl = document.getElementById('tagline');
    const navEl     = document.getElementById('nav');

    // case management!! reset before rerunning in case of replay added later
    container.innerHTML = '';
    nameEl.classList.remove('revealed');
    roleEl.classList.remove('visible', 'exit');
    roleEl.textContent = '';
    taglineEl.classList.remove('visible');
    navEl.classList.remove('visible');

    if (roleCycle) clearInterval(roleCycle);
    roleIndex = 0;

    // static html is a problem — dynamically builds so morph can reference DOM 
    lineData.forEach((tokens, li) => {
        const line = document.createElement('div');
        line.className = 'hp-mono mono-line';

        tokens.forEach(tok => {
            const span = document.createElement('span');
            span.className = 'token ' + (tok.cls || '');
            span.textContent = tok.text;
            line.appendChild(span);

            if (tok.morphsTo) {
                // glitch to final word + hover replay after dekay
                setTimeout(() => {
                    glitchText(span, tok.morphsTo, MORPH_DURATION, MORPH_STEPS);
                    setTimeout(() => attachHoverGlitch(span, tok.morphsTo), MORPH_DURATION + 100);
                }, MORPH_DELAY + li * 80); // avoids firing together all at once
            } else {
                setTimeout(() => {
                    attachHoverGlitch(span, tok.text);
                }, MORPH_DELAY + MORPH_DURATION + 200);
            }
        });

        container.appendChild(line);
        // 260ms interval
        setTimeout(() => line.classList.add('visible'), li * 260 + 150);
    });

    // reveals name left to right
    setTimeout(() => nameEl.classList.add('revealed'), 1700);

    // cycling through role array
    setTimeout(() => {
        roleEl.textContent = roles[0];
        roleEl.classList.add('visible');

        roleCycle = setInterval(() => {
            roleEl.classList.add('exit');
            setTimeout(() => {
                roleIndex = (roleIndex + 1) % roles.length;
                roleEl.textContent = roles[roleIndex];
                roleEl.classList.remove('exit');
                roleEl.classList.add('visible');
                if (roleIndex === roles.length - 1) clearInterval(roleCycle);
            }, 300);
        }, 1600);
    }, 2100);

    setTimeout(() => taglineEl.classList.add('visible'), 2500);
    setTimeout(() => navEl.classList.add('visible'), 3000);
}

runSequence();
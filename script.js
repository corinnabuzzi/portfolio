const monoLines = [
    { text: '<span class="dim">parsing</span> <span class="blue">natural_language</span><span class="dim">.morphology</span>', delay: 0 },
    { text: '<span class="dim">mapping</span> <span class="blue">syntax_tree</span> <span class="dim">→</span> <span class="blue">ast</span>', delay: 320 },
    { text: '<span class="dim">found:</span> <span class="blue">convergence</span><span class="dim">(linguistics, cs)</span>', delay: 640 },
    { text: '<span class="blue">resolve</span><span class="dim">(</span><span class="blue">"Corinna Buzzi"</span><span class="dim">)</span> <span class="dim">→</span>', delay: 960 },
];

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

    container.innerHTML = '';
    nameEl.classList.remove('revealed');
    roleEl.classList.remove('visible', 'exit');
    roleEl.textContent = '';
    taglineEl.classList.remove('visible');
    navEl.classList.remove('visible');

    if (roleCycle) clearInterval(roleCycle);
    roleIndex = 0;

    monoLines.forEach(({ text, delay }) => {
        const span = document.createElement('span');
        span.className = 'hp-mono';
        span.innerHTML = text + (delay === 960 ? '<span class="hp-cursor"></span>' : '');
        container.appendChild(span);

        setTimeout(() => span.classList.add('visible'), delay + 200);
    });

    setTimeout(() => {
        const cursor = container.querySelector('.hp-cursor');
        if (cursor) cursor.remove();
        nameEl.classList.add('revealed');
    }, 1700);

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
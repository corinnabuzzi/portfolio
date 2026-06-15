function runSequence() {
    const nameEl    = document.getElementById('name');
    const roleEl    = document.getElementById('role');
    const taglineEl = document.getElementById('tagline');
    const navEl     = document.getElementById('nav');

    nameEl.classList.remove('revealed');
    roleEl.classList.remove('visible');
    taglineEl.classList.remove('visible');
    navEl.classList.remove('visible');

    setTimeout(() => nameEl.classList.add('revealed'),    200);
    setTimeout(() => roleEl.classList.add('visible'),     900);
    setTimeout(() => taglineEl.classList.add('visible'), 1400);
    setTimeout(() => navEl.classList.add('visible'),     1800);
}

runSequence();
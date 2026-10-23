// Shared presentation only. Learning rules and saved results stay in the mission reducers.
window.fixiverseMissionUI = (root, {phase, instruction, steps, current}) => {
  const previous = root.dataset.missionPhase;
  root.dataset.missionPhase = phase;
  const main = root.querySelector('main');
  const workspace = main?.querySelector('.workspace-grid,.grove-layout,.welcome,.lab-main-grid') || main?.querySelector('.intro-row')?.nextElementSibling;
  if (workspace && instruction) {
    const guide = document.createElement('section');
    guide.className = 'mission-next';
    guide.setAttribute('aria-label', 'Your next step');
    const label = document.createElement('span');
    label.textContent = 'YOUR NEXT STEP';
    const text = document.createElement('p');
    text.textContent = instruction;
    guide.append(label, text);
    workspace.before(guide);
  }
  if (steps) {
    const nav = document.createElement('nav');
    nav.className = 'chapter-progress';
    nav.setAttribute('aria-label', 'Mission progress');
    steps.forEach((name, index) => {
      const item = document.createElement('span');
      item.textContent = `${index < current ? '✓' : index + 1}  ${name}`;
      if (index === current) item.setAttribute('aria-current', 'step');
      if (index < current) item.className = 'done';
      nav.append(item);
    });
    main?.querySelector('.eyebrow')?.before(nav);
  }
  const reduced = root.classList.contains('reduced') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touring = window.fixiverseTour?.scrolling();
  if (!touring && previous !== phase) {
    if (!reduced) main?.animate([{opacity: .45, transform: 'translateY(8px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 220, easing: 'ease-out'});
    if (previous) root.querySelector('#screen-title')?.scrollIntoView({block: 'start', behavior: reduced ? 'instant' : 'smooth'});
  }
  const result = root.querySelector('.result');
  const resultText = result?.textContent || '';
  if (result && resultText !== root.dataset.lastMissionResult && !reduced && !touring) {
    result.animate([{opacity: .3, transform: 'translateY(5px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 180, easing: 'ease-out'});
  }
  root.dataset.lastMissionResult = resultText;
};

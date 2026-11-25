// The semantic project cards are the shared source for the reading and 3D views.
const projects = [...document.querySelectorAll('.project-card')].map(card => [
  card.querySelector('h3').textContent,
  card.querySelector('.project-category').textContent,
  card.querySelector('.project-summary').textContent,
  card.querySelector('details')?.id || '',
  [...card.querySelectorAll('.badges span')].map(tag => tag.textContent)
]);
// All cards stay in the document. Without JavaScript they remain a simple grid.
const projectGrid = document.querySelector('#project-controls');
const projectCards = [...projectGrid.querySelectorAll('.project-card')];
const carouselNavigation = document.querySelector('#project-carousel-navigation');
const carouselDots = document.querySelector('#project-carousel-dots');
const carouselPrevious = document.querySelector('#project-carousel-prev');
const carouselNext = document.querySelector('#project-carousel-next');
const carouselStatus = document.querySelector('#project-carousel-status');
const carouselArea = document.querySelector('#projekte .access-copy');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let currentProject = 0;
let automatic = !reducedMotion.matches;
let carouselVisible = false;
let carouselHovered = false;
let carouselFocused = false;
let carouselInteracting = false;
let rotationTimer, scrollTimer;
const dots = projectCards.map((card, index) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Projekt ${index + 1} von ${projectCards.length}: ${card.querySelector('h3').textContent}`);
  dot.setAttribute('aria-controls', 'project-controls');
  dot.addEventListener('click', () => goToProject(index));
  carouselDots.append(dot);
  return dot;
});
projectGrid.classList.add('carousel-enabled');
projectGrid.setAttribute('aria-roledescription', 'Karussell');
carouselNavigation.hidden = false;
function syncCarouselControls() {
  carouselStatus.textContent = `${currentProject + 1} / ${projectCards.length}`;
  carouselPrevious.disabled = currentProject === 0;
  carouselNext.disabled = currentProject === projectCards.length - 1;
  dots.forEach((dot, index) => {
    if (index === currentProject) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
}
function updateCarousel() {
  if (document.body.classList.contains('immersive') || !projectGrid.clientWidth) return;
  const bounds = projectGrid.getBoundingClientRect();
  const center = bounds.left + bounds.width / 2;
  currentProject = projectCards.reduce((best, card, index) => {
    const rect = card.getBoundingClientRect();
    return Math.abs(rect.left + rect.width / 2 - center) < best.distance
      ? {index, distance: Math.abs(rect.left + rect.width / 2 - center)} : best;
  }, {index: 0, distance: Infinity}).index;
  syncCarouselControls();
}
function scheduleRotation() {
  clearTimeout(rotationTimer);
  if (!automatic || !carouselVisible || carouselHovered || carouselFocused || carouselInteracting || document.hidden || document.body.classList.contains('immersive') || projectCards[currentProject].querySelector('details[open]')) return;
  rotationTimer = setTimeout(() => goToProject((currentProject + 1) % projectCards.length), 6000);
}
function goToProject(index, instant = false) {
  if (index < 0 || index >= projectCards.length) return;
  const bounds = projectGrid.getBoundingClientRect();
  const card = projectCards[index].getBoundingClientRect();
  const offset = card.left + card.width / 2 - (bounds.left + bounds.width / 2);
  currentProject = index;
  syncCarouselControls();
  if (Math.abs(offset) > 2) projectGrid.scrollBy({left: offset, behavior: instant || reducedMotion.matches ? 'instant' : 'smooth'});
  scheduleRotation();
}
function updateCarouselFocus() {
  const active = document.activeElement;
  carouselFocused = (projectGrid.contains(active) || carouselNavigation.contains(active)) && active.matches(':focus-visible');
  scheduleRotation();
}
function onCarouselFocus(event) {
  updateCarouselFocus();
  const card = event.target.closest('.project-card');
  if (card) goToProject(projectCards.indexOf(card), true);
}
projectGrid.addEventListener('focusin', onCarouselFocus);
carouselNavigation.addEventListener('focusin', onCarouselFocus);
projectGrid.addEventListener('focusout', () => queueMicrotask(updateCarouselFocus));
carouselNavigation.addEventListener('focusout', () => queueMicrotask(updateCarouselFocus));
projectGrid.addEventListener('pointerdown', () => { carouselInteracting = true; scheduleRotation(); });
window.addEventListener('pointerup', () => { if (carouselInteracting) { carouselInteracting = false; scheduleRotation(); } });
window.addEventListener('pointercancel', () => { if (carouselInteracting) { carouselInteracting = false; scheduleRotation(); } });
projectGrid.addEventListener('toggle', scheduleRotation, true);
projectGrid.addEventListener('keydown', event => {
  if (event.target !== projectGrid || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  goToProject(currentProject + (event.key === 'ArrowRight' ? 1 : -1));
});
projectGrid.addEventListener('scroll', () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => { updateCarousel(); scheduleRotation(); }, 100);
}, {passive: true});
carouselPrevious.addEventListener('click', () => goToProject(currentProject - 1));
carouselNext.addEventListener('click', () => goToProject(currentProject + 1));
carouselArea.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { carouselHovered = true; scheduleRotation(); } });
carouselArea.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { carouselHovered = false; scheduleRotation(); } });
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => { carouselVisible = entries[0].isIntersecting; scheduleRotation(); }, {threshold: .15}).observe(projectGrid);
} else carouselVisible = true;
document.addEventListener('visibilitychange', scheduleRotation);
window.addEventListener('scenevisibilitychange', scheduleRotation);
window.addEventListener('resize', () => { updateCarousel(); scheduleRotation(); });
reducedMotion.addEventListener('change', event => { automatic = !event.matches; scheduleRotation(); });
syncCarouselControls();
const skills = [
  ['JAVA', 'Java und Anwendungen', 'Java'], ['JS', 'JavaScript und 3D', 'JavaScript'],
  ['PHP', 'PHP und Spiellogik', 'PHP'], ['PY', 'Python und Flask', 'Python'],
  ['3D', 'Three.js', 'Three.js'], ['CSV', 'Daten und CSV', 'CSV'],
  ['DKR', 'Docker und Systeme', 'Docker'], ['WEB', 'Weboberflächen', 'HTML']
];
const toggle = document.querySelector('#view-toggle');
const navigation = document.querySelector('#scene-navigation');
const stationButtons = [...navigation.querySelectorAll('[data-station]')];
const sceneAccess = document.querySelector('#scene-access');
let currentStation = 'start';
const status = document.querySelector('#scene-status');
const copies = [...document.querySelectorAll('.access-copy')];
let world, loading = false;
toggle.hidden = false;

function stationChanged(index) {
  currentStation = stationButtons[index]?.dataset.station || 'start';
  stationButtons.forEach((button, i) => {
    if (i === index) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  document.querySelector('#scene-pages').hidden = index !== 2;
}
function pageChanged(page) {
  const count = projects.length;
  document.querySelector('#scene-page-status').textContent = `Seite ${page + 1} von ${count}`;
  const previous = document.querySelector('#scene-previous');
  const next = document.querySelector('#scene-next');
  previous.disabled = page === 0;
  next.disabled = page >= count - 1;
  if (document.body.classList.contains('immersive')) {
    if (document.activeElement === next && next.disabled) previous.focus({preventScroll:true});
    else if (document.activeElement === previous && previous.disabled) next.focus({preventScroll:true});
  }
}
function showReading(target = '#start', focus = false) {
  document.body.classList.remove('immersive');
  copies.forEach(copy => { copy.inert = false; });
  navigation.hidden = true;
  sceneAccess.hidden = true;
  window.dispatchEvent(new Event('scenevisibilitychange'));
  window.dispatchEvent(new Event('resize'));
  const destination = document.querySelector(target) || document.querySelector('#start');
  if (destination instanceof HTMLDetailsElement) destination.open = true;
  destination.scrollIntoView({behavior: 'instant', block: 'start'});
  if (focus) {
    const focusTarget = destination instanceof HTMLDetailsElement ? destination.querySelector('summary') : (destination.querySelector('h1, h2') || destination);
    if (!focusTarget.hasAttribute('tabindex') && !focusTarget.matches('summary')) focusTarget.tabIndex = -1;
    focusTarget.focus({preventScroll: true});
  }
}
async function showScene({ automatic = false } = {}) {
  if (loading) return;
  if (!world) {
    loading = true;
    toggle.disabled = true;
    status.textContent = '3D-Ansicht wird geladen … Die Leseansicht bleibt verfügbar.';
    let interrupted = false;
    const cancelAutomatic = () => { if (automatic) interrupted = true; };
    const interactionEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    interactionEvents.forEach(type => window.addEventListener(type, cancelAutomatic, { passive: true }));
    try {
      const { initScene } = await import('./scene.js');
      if (interrupted) { status.textContent = ''; return; }
      world = initScene({skills, projects, onSkillSelect: () => {}, onPageChange: pageChanged,
        onStationChange: stationChanged, onProgress: value => navigation.style.setProperty('--scene-progress', value.toFixed(4)), onOpenTextView: () => showReading('#start', true),
        onOpenProject: index => showReading(projects[index]?.[3] ? `#${projects[index][3]}` : '#projekte', true),
        onContextLost: () => { showReading('#start', true); status.textContent = 'Die 3D-Ansicht ist nicht mehr verfügbar. Du kannst hier weiterlesen oder die Seite neu laden.'; toggle.disabled = true; }});
      if (!world.available) throw new Error('WebGL unavailable');
      status.textContent = '';
    } catch (error) {
      console.warn('3D-Ansicht konnte nicht geladen werden:', error);
      status.textContent = 'Die 3D-Ansicht konnte nicht geladen werden. Du kannst das Portfolio hier lesen oder es erneut versuchen.';
      world = null;
      return;
    } finally {
      interactionEvents.forEach(type => window.removeEventListener(type, cancelAutomatic));
      loading = false; toggle.disabled = false;
    }
  }
  document.body.classList.add('immersive');
  copies.forEach(copy => { copy.inert = true; });
  navigation.hidden = false;
  sceneAccess.hidden = false;
  window.scrollTo({top: 0, behavior: 'instant'});
  window.dispatchEvent(new Event('scenevisibilitychange'));
  window.dispatchEvent(new Event('resize'));
  stationChanged(0);
  if (!automatic) stationButtons[0].focus({preventScroll:true});
}
toggle.addEventListener('click', () => showScene());
stationButtons.forEach(button => button.addEventListener('click', () => {
  const target = document.getElementById(button.dataset.station);
  window.scrollTo({top: target.getBoundingClientRect().top + window.scrollY, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
}));
document.querySelector('#scene-read').addEventListener('click', () => showReading(currentStation.startsWith('notizen') ? '#ueber-mich' : `#${currentStation}`, true));
document.querySelector('#scene-previous').addEventListener('click', () => world?.turnPage(-1));
document.querySelector('#scene-next').addEventListener('click', () => world?.turnPage(1));
document.querySelector('.skip-link').addEventListener('click', event => {
  if (document.body.classList.contains('immersive')) { event.preventDefault(); showReading('#start', true); }
});
document.querySelector('.copy-email').addEventListener('click', async () => {
  const feedback = document.querySelector('#copy-status');
  try { await navigator.clipboard.writeText('philippesaxer8@gmail.com'); feedback.textContent = 'E-Mail-Adresse kopiert.'; }
  catch { feedback.textContent = 'Kopieren nicht möglich. Die Adresse steht direkt darüber.'; }
});

// Deep links keep their reading-view destination; the normal entry opens in 3D.
if (!location.hash) showScene({automatic: true});

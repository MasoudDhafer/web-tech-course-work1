// flashcards.js — Flashcard study mode logic for FlagMaster

// ---- State ----
const state = {
  deck:       [],         // shuffled array of country objects for current filter
  index:      0,          // current card index within deck
  revealed:   false,
  filter:     'All',
  progress: {
    known:   new Set(),   // country codes the user marked 'known'
    unknown: new Set(),   // country codes the user marked 'still learning'
  },
};

// ---- Cached DOM references ----
const els = {};

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  // Cache elements
  [
    'flashcard', 'fc-flag-img', 'fc-back-flag', 'fc-country-name',
    'fc-continent-label', 'fc-capital', 'fc-fact', 'fc-progress-bar', 'fc-counter',
    'reveal-btn', 'fc-answer-btns', 'know-btn', 'dontknow-btn', 'skip-btn',
    'reset-btn', 'flashcard-main', 'fc-complete', 'fc-complete-msg',
    'fc-final-score', 'restart-deck-btn', 'goto-memory-btn',
    'stat-known', 'stat-unknown', 'stat-total', 'continent-filter',
  ].forEach(id => { els[id] = document.getElementById(id); });

  loadProgress();
  buildContinentFilter();
  buildDeck();
  renderCard();
  renderProgressStats();

  // ---- Event listeners ----
  els['flashcard'].addEventListener('click',     () => { if (!state.revealed) revealCard(); });
  els['reveal-btn'].addEventListener('click',    revealCard);
  els['know-btn'].addEventListener('click',      () => handleAnswer('known'));
  els['dontknow-btn'].addEventListener('click',  () => handleAnswer('unknown'));
  els['skip-btn'].addEventListener('click',      skipCard);
  els['reset-btn'].addEventListener('click',     resetProgress);
  els['restart-deck-btn'].addEventListener('click', restartDeck);
  els['goto-memory-btn'].addEventListener('click',  () => { window.location.href = 'memory.html'; });
});

// ---- Persistence helpers ----
function loadProgress() {
  const saved = storageGet('flagmaster_flashcard_progress');
  if (saved) {
    state.progress.known   = new Set(saved.known   || []);
    state.progress.unknown = new Set(saved.unknown || []);
  }
}

function saveProgress() {
  storageSet('flagmaster_flashcard_progress', {
    known:   [...state.progress.known],
    unknown: [...state.progress.unknown],
  });
}

// ---- Continent Filter ----
function buildContinentFilter() {
  const continents = ['All', ...new Set(COUNTRIES.map(c => c.continent))].sort();
  // Ensure 'All' stays first
  continents.sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b));

  els['continent-filter'].innerHTML = '';
  continents.forEach(cont => {
    const btn = document.createElement('button');
    btn.className    = 'filter-btn' + (cont === 'All' ? ' active' : '');
    btn.textContent  = cont;
    btn.dataset.continent = cont;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = cont;
      buildDeck();
      renderCard();
    });
    els['continent-filter'].appendChild(btn);
  });
}

// ---- Build / Shuffle Deck ----
function buildDeck() {
  let pool = COUNTRIES;
  if (state.filter !== 'All') {
    pool = pool.filter(c => c.continent === state.filter);
  }
  state.deck    = shuffle(pool);
  state.index   = 0;
  state.revealed = false;

  // Ensure completion screen is hidden
  els['fc-complete'].classList.add('hidden');
  els['flashcard-main'].classList.remove('hidden');
}

// ---- Render Current Card ----
function renderCard() {
  if (state.index >= state.deck.length) {
    showComplete();
    return;
  }

  const country = state.deck[state.index];

  // Reset flip
  els['flashcard'].classList.remove('revealed', 'fc-correct', 'fc-wrong');
  state.revealed = false;

  // Populate front
  els['fc-flag-img'].src = flagUrl(country.code);
  els['fc-flag-img'].alt = `Flag of ${country.name}`;

  // Populate back
  els['fc-back-flag'].src  = flagUrl(country.code);
  els['fc-back-flag'].alt  = `Flag of ${country.name}`;
  els['fc-country-name'].textContent    = country.name;
  els['fc-continent-label'].textContent = country.continent;
  els['fc-capital'].textContent         = country.capital ? `🏛 Capital: ${country.capital}` : '';
  els['fc-fact'].textContent            = country.fact    || '';

  // Counter & progress bar
  const progress = ((state.index) / state.deck.length) * 100;
  els['fc-progress-bar'].style.width = `${progress}%`;
  els['fc-counter'].textContent      = `${state.index + 1} / ${state.deck.length}`;

  // Button visibility
  els['reveal-btn'].classList.remove('hidden');
  els['fc-answer-btns'].classList.add('hidden');
}

// ---- Reveal ----
function revealCard() {
  els['flashcard'].classList.add('revealed');
  state.revealed = true;
  els['reveal-btn'].classList.add('hidden');
  els['fc-answer-btns'].classList.remove('hidden');
}

// ---- Handle Answer ----
function handleAnswer(result) {
  const country = state.deck[state.index];

  // Store result — mutually exclusive sets
  state.progress[result].add(country.code);
  if (result === 'known')   state.progress.unknown.delete(country.code);
  else                      state.progress.known.delete(country.code);

  saveProgress();
  renderProgressStats();
  result === 'known' ? Sounds.known() : Sounds.unknown();

  // Flash animation feedback
  const flashClass = result === 'known' ? 'fc-correct' : 'fc-wrong';
  els['flashcard'].classList.add(flashClass);
  setTimeout(() => {
    els['flashcard'].classList.remove(flashClass);
    advanceCard();
  }, 380);
}

// ---- Skip (no progress recorded) ----
function skipCard() {
  advanceCard();
}

function advanceCard() {
  state.index++;
  renderCard();
}

// ---- Progress Stats ----
function renderProgressStats() {
  els['stat-known'].textContent   = state.progress.known.size;
  els['stat-unknown'].textContent = state.progress.unknown.size;
  els['stat-total'].textContent   = COUNTRIES.length;
}

// ---- Completion Screen ----
function showComplete() {
  const known = state.deck.filter(c => state.progress.known.has(c.code)).length;
  const total = state.deck.length;

  els['fc-progress-bar'].style.width = '100%';
  els['fc-counter'].textContent      = `${total} / ${total}`;
  els['fc-final-score'].textContent  = `${known} / ${total}`;
  els['fc-complete-msg'].textContent =
    `You studied all ${total} cards` +
    (state.filter !== 'All' ? ` in the ${state.filter} deck` : '') +
    `. Keep practising!`;

  els['flashcard-main'].classList.add('hidden');
  els['fc-complete'].classList.remove('hidden');
}

// ---- Restart Deck (same filter) ----
function restartDeck() {
  buildDeck();
  renderCard();
}

// ---- Reset All Progress ----
function resetProgress() {
  if (!confirm('Clear all flashcard progress? This cannot be undone.')) return;
  state.progress.known.clear();
  state.progress.unknown.clear();
  saveProgress();
  renderProgressStats();
  buildDeck();
  renderCard();
}

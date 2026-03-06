// memory.js — Card-matching memory game logic for FlagMaster

// ---- Difficulty configuration ----
const DIFFICULTY = {
  easy:   { cols: 4, pairs: 8,  label: 'Easy'   },
  medium: { cols: 6, pairs: 12, label: 'Medium'  },
  hard:   { cols: 6, pairs: 18, label: 'Hard'    },
};

// ---- Mutable game state ----
const state = {
  difficulty: null,
  flipped:    [],     // up to 2 currently face-up, un-matched cards
  matched:    0,      // number of matched pairs
  moves:      0,      // number of flip-pair attempts
  seconds:    0,
  timer:      null,
  locked:     false,  // blocks clicks while checking a pair
};

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  // Difficulty buttons
  document.querySelectorAll('.difficulty-card').forEach(btn => {
    btn.addEventListener('click', () => startGame(btn.dataset.difficulty));
  });

  // HUD — back to menu
  document.getElementById('restart-btn').addEventListener('click', showDifficultyScreen);

  // Win modal buttons
  document.getElementById('save-score-btn').addEventListener('click', saveScore);
  document.getElementById('play-again-btn').addEventListener('click', () => {
    closeWinModal();
    showDifficultyScreen();
  });
});

// ---- Screens ----
function showDifficultyScreen() {
  clearInterval(state.timer);
  document.getElementById('difficulty-screen').classList.remove('hidden');
  document.getElementById('game-screen').classList.add('hidden');
  closeWinModal();
}

// ---- Start / Reset Game ----
function startGame(difficulty) {
  Object.assign(state, {
    difficulty,
    flipped:  [],
    matched:  0,
    moves:    0,
    seconds:  0,
    locked:   false,
  });

  clearInterval(state.timer);

  const { cols, pairs } = DIFFICULTY[difficulty];
  // Pick `pairs` random countries, duplicate for matching, then shuffle
  const chosen = shuffle(COUNTRIES).slice(0, pairs);
  const cards  = shuffle([...chosen, ...chosen]);

  renderBoard(cols, cards);
  updateHUD();

  document.getElementById('difficulty-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');

  // Start timer
  state.timer = setInterval(() => {
    state.seconds++;
    document.getElementById('timer').textContent = formatTime(state.seconds);
  }, 1000);
}

// ---- Render Board ----
function renderBoard(cols, cards) {
  const board = document.getElementById('game-board');
  board.style.setProperty('--cols', cols);
  board.innerHTML = '';

  cards.forEach(country => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.code = country.code;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Flag card — face down');

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-cover"><span>🌍</span></div>
        <div class="card-face">
          <img src="${flagUrl(country.code)}"
               alt="Flag of ${escapeHtml(country.name)}"
               loading="lazy" />
        </div>
      </div>`;

    card.addEventListener('click', () => onCardClick(card));
    board.appendChild(card);
  });
}

// ---- Card Click Handler ----
function onCardClick(card) {
  if (state.locked)                                            return;
  if (card.classList.contains('flipped'))                     return;
  if (card.classList.contains('matched'))                     return;
  if (state.flipped.length >= 2)                              return;

  card.classList.add('flipped');
  card.setAttribute('aria-label', `Flag card — ${card.dataset.code.toUpperCase()}`);
  state.flipped.push(card);

  if (state.flipped.length === 2) {
    state.moves++;
    document.getElementById('moves').textContent = state.moves;
    state.locked = true;
    // Short delay so both flags are visible before check
    setTimeout(checkMatch, 750);
  }
}

// ---- Match Check ----
function checkMatch() {
  const [a, b] = state.flipped;

  if (a.dataset.code === b.dataset.code) {
    // ✅ Match
    a.classList.add('matched');
    b.classList.add('matched');
    state.matched++;
    updatePairs();
    state.flipped = [];
    state.locked  = false;
    Sounds.match();

    if (state.matched === DIFFICULTY[state.difficulty].pairs) {
      // Small delay for the last card's match animation to settle
      setTimeout(onWin, 400);
    }
  } else {
    // ❌ No match — shake then flip back
    a.classList.add('wrong');
    b.classList.add('wrong');
    Sounds.mismatch();
    setTimeout(() => {
      a.classList.remove('flipped', 'wrong');
      b.classList.remove('flipped', 'wrong');
      a.setAttribute('aria-label', 'Flag card — face down');
      b.setAttribute('aria-label', 'Flag card — face down');
      state.flipped = [];
      state.locked  = false;
    }, 550);
  }
}

// ---- Win Condition ----
function onWin() {
  clearInterval(state.timer);
  Sounds.win();
  launchConfetti();

  // Star rating: based on ratio of moves to minimum (= pairs)
  const pairs = DIFFICULTY[state.difficulty].pairs;
  const ratio = state.moves / pairs;
  const rating = ratio <= 1.4 ? '⭐⭐⭐'
               : ratio <= 2.0 ? '⭐⭐'
               :                '⭐';

  document.getElementById('modal-difficulty').textContent = `${DIFFICULTY[state.difficulty].label} mode`;
  document.getElementById('modal-rating').textContent     = rating;
  document.getElementById('final-time').textContent       = formatTime(state.seconds);
  document.getElementById('final-moves').textContent      = state.moves;
  document.getElementById('player-name').value            = '';

  // Re-enable save button (may have been disabled on a previous win)
  const saveBtn = document.getElementById('save-score-btn');
  saveBtn.disabled   = false;
  saveBtn.textContent = 'Save Score';

  document.getElementById('win-modal').classList.remove('hidden');
}

function closeWinModal() {
  document.getElementById('win-modal').classList.add('hidden');
}

// ---- Save Score to localStorage ----
function saveScore() {
  const name       = document.getElementById('player-name').value.trim() || 'Anonymous';
  const difficulty = state.difficulty;
  const scores     = storageGet('flagmaster_scores') || { easy: [], medium: [], hard: [] };

  scores[difficulty].push({
    name,
    time:          state.seconds,
    timeFormatted: formatTime(state.seconds),
    moves:         state.moves,
    date:          new Date().toLocaleDateString(),
  });

  // Keep top 10 per difficulty, sorted by fastest time
  scores[difficulty].sort((a, b) => a.time - b.time);
  scores[difficulty] = scores[difficulty].slice(0, 10);
  storageSet('flagmaster_scores', scores);

  // Increment global games-played counter
  const stats      = storageGet('flagmaster_stats') || { gamesPlayed: 0 };
  stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
  storageSet('flagmaster_stats', stats);

  // Visual confirmation then redirect to leaderboard
  const btn = document.getElementById('save-score-btn');
  btn.textContent = '✓ Saved!';
  btn.disabled    = true;
  setTimeout(() => { window.location.href = 'leaderboard.html'; }, 900);
}

// ---- HUD Helpers ----
function updateHUD() {
  document.getElementById('timer').textContent = '00:00';
  document.getElementById('moves').textContent = '0';
  updatePairs();
}

function updatePairs() {
  const total = DIFFICULTY[state.difficulty].pairs;
  document.getElementById('pairs').textContent = `${state.matched} / ${total}`;
}

// ---- Confetti ----
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ['#6366f1','#0ea5e9','#f59e0b','#22c55e','#ef4444','#ec4899','#a855f7'];
  const pieces = Array.from({ length: 140 }, () => ({
    x:    Math.random() * canvas.width,
    y:    Math.random() * -canvas.height,
    w:    6 + Math.random() * 8,
    h:    10 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speed: 2.5 + Math.random() * 3.5,
    angle: Math.random() * Math.PI * 2,
    spin:  (Math.random() - 0.5) * 0.2,
    drift: (Math.random() - 0.5) * 1.5,
  }));

  let frame;
  let elapsed = 0;
  const DURATION = 3200;
  const startTime = performance.now();

  function draw(now) {
    elapsed = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const opacity = elapsed > DURATION - 600
      ? Math.max(0, 1 - (elapsed - (DURATION - 600)) / 600)
      : 1;
    pieces.forEach(p => {
      p.y     += p.speed;
      p.x     += p.drift;
      p.angle += p.spin;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (elapsed < DURATION) {
      frame = requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }
  frame = requestAnimationFrame(draw);
}

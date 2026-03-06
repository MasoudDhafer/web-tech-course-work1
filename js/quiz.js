// quiz.js — Flag Quiz game logic for FlagMaster

const TOTAL_QUESTIONS = 10;
const OPTIONS_COUNT   = 4;

const state = {
  questions:    [],   // array of question objects for this round
  index:        0,
  score:        0,
  streak:       0,
  bestStreak:   0,
  answered:     false,
};

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  loadBestStreak();
  buildQuiz();

  document.getElementById('next-btn').addEventListener('click', nextQuestion);
  document.getElementById('play-again-quiz').addEventListener('click', () => {
    document.getElementById('quiz-end').classList.add('hidden');
    document.getElementById('quiz-main').classList.remove('hidden');
    buildQuiz();
  });
});

// ---- Build a fresh 10-question round ----
function buildQuiz() {
  const pool = shuffle(COUNTRIES);

  state.questions = pool.slice(0, TOTAL_QUESTIONS).map(correct => {
    // Pick 3 wrong answers from the remaining pool
    const others  = pool.filter(c => c.code !== correct.code);
    const wrong   = shuffle(others).slice(0, OPTIONS_COUNT - 1);
    const options = shuffle([correct, ...wrong]);
    return { correct, options };
  });

  Object.assign(state, { index: 0, score: 0, streak: 0, answered: false });
  renderQuestion();
  updateHUD();
}

// ---- Render current question ----
function renderQuestion() {
  if (state.index >= state.questions.length) {
    showEndScreen();
    return;
  }

  const { correct, options } = state.questions[state.index];
  state.answered = false;

  // Progress
  const pct = (state.index / TOTAL_QUESTIONS) * 100;
  document.getElementById('quiz-progress-bar').style.width = `${pct}%`;
  document.getElementById('quiz-q-counter').textContent =
    `Question ${state.index + 1} / ${TOTAL_QUESTIONS}`;

  // Flag
  const flagWrap = document.getElementById('quiz-flag-wrap');
  flagWrap.classList.remove('correct', 'wrong');
  document.getElementById('quiz-flag-img').src = flagUrl(correct.code);
  document.getElementById('quiz-flag-img').alt = 'Mystery flag';

  // Feedback
  const fb = document.getElementById('quiz-feedback');
  fb.textContent = '';
  fb.className   = 'quiz-feedback';

  // Next button
  document.getElementById('next-btn').classList.add('hidden');

  // Options
  const container = document.getElementById('quiz-options');
  container.innerHTML = '';
  options.forEach(country => {
    const btn = document.createElement('button');
    btn.className   = 'quiz-option';
    btn.textContent = country.name;
    btn.dataset.code = country.code;
    btn.addEventListener('click', () => handleAnswer(btn, correct));
    container.appendChild(btn);
  });
}

// ---- Handle answer ----
function handleAnswer(selectedBtn, correct) {
  if (state.answered) return;
  state.answered = true;

  const allBtns   = document.querySelectorAll('.quiz-option');
  const isCorrect = selectedBtn.dataset.code === correct.code;

  // Disable all buttons
  allBtns.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.code === correct.code) btn.classList.add('correct');
  });

  const flagWrap = document.getElementById('quiz-flag-wrap');
  const fb       = document.getElementById('quiz-feedback');

  if (isCorrect) {
    state.score++;
    state.streak++;
    if (state.streak > state.bestStreak) {
      state.bestStreak = state.streak;
      saveBestStreak();
    }
    selectedBtn.classList.add('correct');
    flagWrap.classList.add('correct');
    fb.textContent = `✓ Correct! That's ${correct.name}.`;
    fb.className   = 'quiz-feedback correct';
    Sounds.quizCorrect();
  } else {
    selectedBtn.classList.add('wrong');
    flagWrap.classList.add('wrong');
    state.streak = 0;
    fb.textContent = `✗ Wrong — that was ${correct.name}.`;
    fb.className   = 'quiz-feedback wrong';
    Sounds.quizWrong();
  }

  updateHUD();

  // Show next button (or finish if last question)
  if (state.index < TOTAL_QUESTIONS - 1) {
    document.getElementById('next-btn').classList.remove('hidden');
  } else {
    // Small delay then show end screen
    setTimeout(showEndScreen, 1100);
  }
}

// ---- Advance ----
function nextQuestion() {
  state.index++;
  renderQuestion();
  updateHUD();
}

// ---- HUD ----
function updateHUD() {
  document.getElementById('q-score').textContent  = state.score;
  document.getElementById('q-streak').textContent = state.streak + (state.streak >= 3 ? '🔥' : '');
  document.getElementById('q-best').textContent   = state.bestStreak;
}

// ---- End Screen ----
function showEndScreen() {
  document.getElementById('quiz-main').classList.add('hidden');
  document.getElementById('quiz-end').classList.remove('hidden');

  const score = state.score;
  let icon, title, msg;

  if (score === 10) {
    icon  = '🏆'; title = 'Perfect Score!';
    msg   = 'Incredible — you got every single flag correct!';
    Sounds.win();
    launchConfetti();
  } else if (score >= 7) {
    icon  = '🌟'; title = 'Great Job!';
    msg   = 'You really know your flags!';
  } else if (score >= 4) {
    icon  = '👍'; title = 'Not Bad!';
    msg   = 'Keep practising and you\'ll ace it next time.';
  } else {
    icon  = '📚'; title = 'Keep Studying!';
    msg   = 'Try the Flashcards mode to brush up before playing again.';
  }

  document.getElementById('end-icon').textContent        = icon;
  document.getElementById('end-title').textContent       = title;
  document.getElementById('end-msg').textContent         = msg;
  document.getElementById('quiz-final-score').textContent = score;

  // Update progress bar to 100%
  document.getElementById('quiz-progress-bar').style.width = '100%';
}

// ---- Persist best streak ----
function loadBestStreak() {
  state.bestStreak = storageGet('flagmaster_quiz_best_streak') || 0;
}
function saveBestStreak() {
  storageSet('flagmaster_quiz_best_streak', state.bestStreak);
}

// ---- Confetti (reused from memory.js pattern) ----
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ['#6366f1','#0ea5e9','#f59e0b','#22c55e','#ef4444','#ec4899','#a855f7'];
  const pieces = Array.from({ length: 140 }, () => ({
    x:     Math.random() * canvas.width,
    y:     Math.random() * -canvas.height,
    w:     6 + Math.random() * 8,
    h:     10 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speed: 2.5 + Math.random() * 3.5,
    angle: Math.random() * Math.PI * 2,
    spin:  (Math.random() - 0.5) * 0.2,
    drift: (Math.random() - 0.5) * 1.5,
  }));

  let frame;
  const DURATION  = 3200;
  const startTime = performance.now();

  function draw(now) {
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const opacity = elapsed > DURATION - 600
      ? Math.max(0, 1 - (elapsed - (DURATION - 600)) / 600) : 1;
    pieces.forEach(p => {
      p.y += p.speed; p.x += p.drift; p.angle += p.spin;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (elapsed < DURATION) { frame = requestAnimationFrame(draw); }
    else { canvas.remove(); }
  }
  frame = requestAnimationFrame(draw);
}

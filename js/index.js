// index.js — Homepage statistics panel

document.addEventListener('DOMContentLoaded', () => {
  renderHeroStats();
  renderStatsGrid();
});

function renderHeroStats() {
  const gameStats    = storageGet('flagmaster_stats')              || { gamesPlayed: 0 };
  const flashProg    = storageGet('flagmaster_flashcard_progress') || { known: [] };
  const scores       = storageGet('flagmaster_scores')             || { easy: [], medium: [], hard: [] };
  const allScores    = [...scores.easy, ...scores.medium, ...scores.hard];
  const bestTime     = allScores.length > 0
    ? Math.min(...allScores.map(s => s.time))
    : null;

  document.getElementById('hero-stats').innerHTML = `
    <div class="hero-stat">
      <div class="stat-value">${gameStats.gamesPlayed || 0}</div>
      <div class="stat-label">Games Played</div>
    </div>
    <div class="hero-stat">
      <div class="stat-value">${(flashProg.known || []).length}</div>
      <div class="stat-label">Flags Known</div>
    </div>
    <div class="hero-stat">
      <div class="stat-value">${bestTime !== null ? formatTime(bestTime) : '—'}</div>
      <div class="stat-label">Best Time</div>
    </div>
  `;
}

function renderStatsGrid() {
  const scores      = storageGet('flagmaster_scores')             || { easy: [], medium: [], hard: [] };
  const flashProg   = storageGet('flagmaster_flashcard_progress') || { known: [], unknown: [] };
  const gameStats   = storageGet('flagmaster_stats')              || { gamesPlayed: 0 };
  const bestStreak  = storageGet('flagmaster_quiz_best_streak')   || 0;

  const easyBest   = scores.easy[0]   || null;
  const medBest    = scores.medium[0] || null;
  const hardBest   = scores.hard[0]   || null;
  const knownCount = (flashProg.known || []).length;

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card">
      <div class="big-number">${gameStats.gamesPlayed || 0}</div>
      <div class="stat-label">Games Played</div>
    </div>
    <div class="stat-card">
      <div class="big-number">${knownCount} / ${COUNTRIES.length}</div>
      <div class="stat-label">Flags Known</div>
    </div>
    <div class="stat-card">
      <div class="big-number">${easyBest ? easyBest.timeFormatted : '—'}</div>
      <div class="stat-label">Best · Easy</div>
    </div>
    <div class="stat-card">
      <div class="big-number">${medBest ? medBest.timeFormatted : '—'}</div>
      <div class="stat-label">Best · Medium</div>
    </div>
    <div class="stat-card">
      <div class="big-number">${hardBest ? hardBest.timeFormatted : '—'}</div>
      <div class="stat-label">Best · Hard</div>
    </div>
    <div class="stat-card">
      <div class="big-number">${bestStreak} 🔥</div>
      <div class="stat-label">Quiz Best Streak</div>
    </div>
  `;
}

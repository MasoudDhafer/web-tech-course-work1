// leaderboard.js — High score display for FlagMaster memory game

const MEDALS = ['🥇', '🥈', '🥉'];

let activeTab = 'easy';

document.addEventListener('DOMContentLoaded', () => {
  // ---- Tab buttons ----
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeTab = tab.dataset.difficulty;
      renderScores(activeTab);
    });
  });

  // ---- Clear scores ----
  document.getElementById('clear-scores-btn').addEventListener('click', () => {
    if (!confirm('Clear ALL scores? This cannot be undone.')) return;
    localStorage.removeItem('flagmaster_scores');
    renderScores(activeTab);
  });

  // ---- Initial render — activate first tab ----
  tabs[0].classList.add('active');
  tabs[0].setAttribute('aria-selected', 'true');
  renderScores('easy');
});

// ---- Render ----
function renderScores(difficulty) {
  const allScores = storageGet('flagmaster_scores') || {};
  const list      = (allScores[difficulty] || []).slice(0, 10);
  const container = document.getElementById('scores-container');

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-lb">
        <div class="empty-icon">🏆</div>
        <p>No scores yet for <strong>${capitalise(difficulty)}</strong> mode.</p>
        <p>Beat a game and save your score to appear here!</p>
      </div>`;
    return;
  }

  const rows = list.map((score, i) => {
    const medal = i < 3 ? MEDALS[i] : String(i + 1);
    return `
      <tr>
        <td class="rank-cell">${medal}</td>
        <td>${escapeHtml(score.name)}</td>
        <td>${escapeHtml(score.timeFormatted)}</td>
        <td>${escapeHtml(String(score.moves))}</td>
        <td>${escapeHtml(score.date)}</td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="scores-table" aria-label="${capitalise(difficulty)} difficulty scores">
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>Time</th>
          <th>Moves</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

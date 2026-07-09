/* ===================================================================
   Tic Tac Toe — Game Logic + AI Engine + Animations
   
   Evaluation logic ported from the Python notebook (evaluate function)
   AI: Easy (random), Medium (40% minimax), Hard (full minimax)
   =================================================================== */

(() => {
  'use strict';

  const EMPTY = '_';
  const X     = 'x';
  const O     = 'o';

  // ── Settings ───────────────────────────────────────────────────────
  let gameMode   = 'pvp';
  let difficulty = 'easy';
  const AI_MARK  = O;
  const HUMAN    = X;

  // ── State ──────────────────────────────────────────────────────────
  let board       = Array(9).fill(EMPTY);
  let currentTurn = X;
  let gameOver    = false;
  let aiThinking  = false;
  let moveNumber  = 0;
  let roundNumber = 1;
  let lastMoveIdx = -1;
  let scores      = { x: 0, o: 0, draw: 0 };

  const WIN_LINE_COORDS = {
    '0,1,2': [16.67, 16.67, 83.33, 16.67],
    '3,4,5': [16.67, 50,    83.33, 50],
    '6,7,8': [16.67, 83.33, 83.33, 83.33],
    '0,3,6': [16.67, 16.67, 16.67, 83.33],
    '1,4,7': [50,    16.67, 50,    83.33],
    '2,5,8': [83.33, 16.67, 83.33, 83.33],
    '0,4,8': [16.67, 16.67, 83.33, 83.33],
    '2,4,6': [83.33, 16.67, 16.67, 83.33],
  };

  // ── DOM — Mode Screen ─────────────────────────────────────────────
  const modeScreen    = document.getElementById('mode-screen');
  const gameScreen    = document.getElementById('game-screen');
  const btnModePvp    = document.getElementById('btn-mode-pvp');
  const btnModeAi     = document.getElementById('btn-mode-ai');
  const toggleSlider  = document.getElementById('toggle-slider');
  const diffSection   = document.getElementById('difficulty-section');
  const diffBtns      = document.querySelectorAll('.diff-btn');
  const btnStartGame  = document.getElementById('btn-start-game');

  // ── DOM — Game Screen ─────────────────────────────────────────────
  const cells          = document.querySelectorAll('.cell');
  const gameBoard      = document.getElementById('game-board');
  const turnIndicator  = document.getElementById('turn-indicator');
  const turnSymbol     = document.getElementById('turn-symbol');
  const turnText       = document.getElementById('turn-text');
  const moveCountEl    = document.getElementById('move-count');
  const scoreXEl       = document.getElementById('score-x');
  const scoreOEl       = document.getElementById('score-o');
  const scoreDrawEl    = document.getElementById('score-draw');
  const scoreCardX     = document.getElementById('score-card-x');
  const scoreCardO     = document.getElementById('score-card-o');
  const labelX         = document.getElementById('label-x');
  const labelO         = document.getElementById('label-o');
  const modeTag        = document.getElementById('mode-tag');
  const roundBadge     = document.getElementById('round-badge');
  const resultOverlay  = document.getElementById('result-overlay');
  const resultTitle    = document.getElementById('result-title');
  const resultSub      = document.getElementById('result-sub');
  const resultIcon     = document.getElementById('result-icon');
  const resultMark     = document.getElementById('result-mark');
  const statMoves      = document.getElementById('stat-moves');
  const statRound      = document.getElementById('stat-round');
  const btnPlayAgain   = document.getElementById('btn-play-again');
  const btnReset       = document.getElementById('btn-reset');
  const btnResetScores = document.getElementById('btn-reset-scores');
  const btnChangeMode  = document.getElementById('btn-change-mode');
  const winLineSvg     = document.getElementById('win-line-svg');
  const winLine        = document.getElementById('win-line');
  const confettiBox    = document.getElementById('confetti-container');

  // ══════════════════════════════════════════════════════════════════
  //  CONFETTI
  // ══════════════════════════════════════════════════════════════════

  function spawnConfetti(color) {
    confettiBox.innerHTML = '';
    const colors = color === 'cyan'
      ? ['#3dd6d0', '#9c7cf4', '#6ee7e7', '#b794f6']
      : color === 'rose'
      ? ['#f06292', '#f48fb1', '#9c7cf4', '#f8bbd0']
      : ['#f0b957', '#ffd54f', '#ffe082', '#9c7cf4'];

    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (1.5 + Math.random() * 2) + 's';
      piece.style.animationDelay = (Math.random() * 0.6) + 's';
      piece.style.width = (4 + Math.random() * 5) + 'px';
      piece.style.height = (4 + Math.random() * 5) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '1px';
      confettiBox.appendChild(piece);
    }

    // Clean up after animation
    setTimeout(() => { confettiBox.innerHTML = ''; }, 4000);
  }

  // ══════════════════════════════════════════════════════════════════
  //  MODE SELECTION
  // ══════════════════════════════════════════════════════════════════

  btnModePvp.addEventListener('click', () => {
    gameMode = 'pvp';
    btnModePvp.classList.add('active');
    btnModeAi.classList.remove('active');
    toggleSlider.classList.remove('right');
    diffSection.classList.add('hidden');
  });

  btnModeAi.addEventListener('click', () => {
    gameMode = 'ai';
    btnModeAi.classList.add('active');
    btnModePvp.classList.remove('active');
    toggleSlider.classList.add('right');
    diffSection.classList.remove('hidden');
  });

  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      difficulty = btn.dataset.diff;
    });
  });

  btnStartGame.addEventListener('click', startGame);

  function startGame() {
    if (gameMode === 'ai') {
      labelX.textContent = 'You';
      labelO.textContent = 'AI';
      const labels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
      modeTag.textContent = 'AI / ' + labels[difficulty];
    } else {
      labelX.textContent = 'X';
      labelO.textContent = 'O';
      modeTag.textContent = '2 Players';
    }

    scores = { x: 0, o: 0, draw: 0 };
    roundNumber = 1;
    modeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    resetBoard();
    renderScores();
    updateRoundBadge();
  }

  btnChangeMode.addEventListener('click', () => {
    gameScreen.classList.add('hidden');
    modeScreen.classList.remove('hidden');
  });

  // ══════════════════════════════════════════════════════════════════
  //  EVALUATE — ported from Python notebook
  // ══════════════════════════════════════════════════════════════════

  function evaluate(b) {
    const m = [
      [b[0], b[1], b[2]],
      [b[3], b[4], b[5]],
      [b[6], b[7], b[8]]
    ];

    for (let row = 0; row < 3; row++) {
      if (m[row][0] === m[row][1] && m[row][1] === m[row][2]) {
        if (m[row][0] === X) return { score: 10,  combo: [row * 3, row * 3 + 1, row * 3 + 2] };
        if (m[row][0] === O) return { score: -10, combo: [row * 3, row * 3 + 1, row * 3 + 2] };
      }
    }

    for (let col = 0; col < 3; col++) {
      if (m[0][col] === m[1][col] && m[1][col] === m[2][col]) {
        if (m[0][col] === X) return { score: 10,  combo: [col, col + 3, col + 6] };
        if (m[0][col] === O) return { score: -10, combo: [col, col + 3, col + 6] };
      }
    }

    if (m[0][0] === m[1][1] && m[1][1] === m[2][2]) {
      if (m[0][0] === X) return { score: 10,  combo: [0, 4, 8] };
      if (m[0][0] === O) return { score: -10, combo: [0, 4, 8] };
    }

    if (m[0][2] === m[1][1] && m[1][1] === m[2][0]) {
      if (m[0][2] === X) return { score: 10,  combo: [2, 4, 6] };
      if (m[0][2] === O) return { score: -10, combo: [2, 4, 6] };
    }

    return { score: 0, combo: null };
  }

  // ══════════════════════════════════════════════════════════════════
  //  AI ENGINE — Minimax + Alpha-Beta
  // ══════════════════════════════════════════════════════════════════

  function getEmptyCells(b) {
    const empty = [];
    for (let i = 0; i < 9; i++) {
      if (b[i] === EMPTY) empty.push(i);
    }
    return empty;
  }

  function minimax(b, depth, isMaximizing, alpha, beta) {
    const result = evaluate(b);
    if (result.score === 10)  return 10 - depth;
    if (result.score === -10) return -10 + depth;
    if (getEmptyCells(b).length === 0) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (const idx of getEmptyCells(b)) {
        b[idx] = X;
        best = Math.max(best, minimax(b, depth + 1, false, alpha, beta));
        b[idx] = EMPTY;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const idx of getEmptyCells(b)) {
        b[idx] = O;
        best = Math.min(best, minimax(b, depth + 1, true, alpha, beta));
        b[idx] = EMPTY;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  function getBestMoveHard(b) {
    let bestScore = Infinity;
    let bestMove  = -1;
    for (const idx of getEmptyCells(b)) {
      b[idx] = O;
      const score = minimax(b, 0, true, -Infinity, Infinity);
      b[idx] = EMPTY;
      if (score < bestScore) { bestScore = score; bestMove = idx; }
    }
    return bestMove;
  }

  function getRandomMove(b) {
    const empty = getEmptyCells(b);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  function getAIMove(b) {
    if (getEmptyCells(b).length === 0) return -1;
    switch (difficulty) {
      case 'easy':   return getRandomMove(b);
      case 'medium': return Math.random() < 0.4 ? getBestMoveHard(b) : getRandomMove(b);
      case 'hard':   return getBestMoveHard(b);
      default:       return getRandomMove(b);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════

  function renderBoard() {
    cells.forEach((cell, i) => {
      cell.classList.remove(X, O, 'taken', 'winner', 'last-move');
      const content = cell.querySelector('.cell-content');
      if (board[i] === X) {
        content.textContent = 'X';
        cell.classList.add(X, 'taken');
      } else if (board[i] === O) {
        content.textContent = 'O';
        cell.classList.add(O, 'taken');
      } else {
        content.textContent = '';
      }
      if (i === lastMoveIdx && board[i] !== EMPTY) {
        cell.classList.add('last-move');
      }
    });
  }

  function renderTurn() {
    turnIndicator.classList.remove('x-turn', 'o-turn', 'ai-thinking', 'switching');

    if (currentTurn === X) {
      turnIndicator.classList.add('x-turn');
      turnSymbol.textContent = 'X';
      turnText.textContent = gameMode === 'ai' ? ' — your turn' : ' — turn';
    } else {
      turnIndicator.classList.add('o-turn');
      turnSymbol.textContent = 'O';
      if (gameMode === 'ai') {
        turnText.textContent = ' — thinking';
        turnIndicator.classList.add('ai-thinking');
      } else {
        turnText.textContent = ' — turn';
      }
    }

    moveCountEl.textContent = 'Move ' + (moveNumber + 1);
    scoreCardX.classList.toggle('active', currentTurn === X && !gameOver);
    scoreCardO.classList.toggle('active', currentTurn === O && !gameOver);
  }

  function animateScore(el) {
    el.classList.remove('bump');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('bump');
  }

  function renderScores() {
    scoreXEl.textContent    = scores.x;
    scoreOEl.textContent    = scores.o;
    scoreDrawEl.textContent = scores.draw;
  }

  function updateRoundBadge() {
    roundBadge.textContent = 'Round ' + roundNumber;
  }

  function showWinLine(combo) {
    const coords = WIN_LINE_COORDS[combo.join(',')];
    if (!coords) return;
    winLine.setAttribute('x1', coords[0]);
    winLine.setAttribute('y1', coords[1]);
    winLine.setAttribute('x2', coords[2]);
    winLine.setAttribute('y2', coords[3]);
    winLineSvg.classList.add('active');
  }

  function hideWinLine() {
    winLineSvg.classList.remove('active', 'o-win');
    winLine.setAttribute('x1', 0);
    winLine.setAttribute('y1', 0);
    winLine.setAttribute('x2', 0);
    winLine.setAttribute('y2', 0);
  }

  function showResult(winner) {
    const isAI = gameMode === 'ai';
    const msg = {
      x:    { t: isAI ? 'You win' : 'X wins',  s: isAI ? 'Well played' : '', mark: 'X', iconCls: 'x-icon', titleCls: 'x-win'  },
      o:    { t: isAI ? 'AI wins' : 'O wins',   s: isAI ? 'Try again'  : '', mark: 'O', iconCls: 'o-icon', titleCls: 'o-win'  },
      draw: { t: 'Draw',                         s: 'No winner',              mark: '=', iconCls: 'draw-icon', titleCls: 'draw' },
    };

    const m = msg[winner];
    resultTitle.textContent = m.t;
    resultTitle.className   = 'result-title ' + m.titleCls;
    resultSub.textContent   = m.s;
    resultMark.textContent  = m.mark;
    resultIcon.className    = 'result-icon ' + m.iconCls;
    statMoves.textContent   = moveNumber;
    statRound.textContent   = roundNumber;

    // Confetti on win (not draw)
    if (winner !== 'draw') {
      spawnConfetti(winner === 'x' ? 'cyan' : 'rose');
    }

    setTimeout(() => resultOverlay.classList.add('visible'), 500);
  }

  function hideResult() {
    resultOverlay.classList.remove('visible');
  }

  // ── Board entrance animation ──
  function playBoardEntrance() {
    gameBoard.classList.remove('entrance');
    void gameBoard.offsetWidth;
    gameBoard.classList.add('entrance');
  }

  // ══════════════════════════════════════════════════════════════════
  //  GAME LOGIC
  // ══════════════════════════════════════════════════════════════════

  function checkEnd() {
    const result = evaluate(board);

    if (result.score === 10 || result.score === -10) {
      gameOver = true;
      const winner = result.score === 10 ? X : O;
      scores[winner]++;
      renderScores();
      animateScore(winner === X ? scoreXEl : scoreOEl);

      result.combo.forEach(i => cells[i].classList.add('winner'));
      if (winner === O) winLineSvg.classList.add('o-win');
      showWinLine(result.combo);
      showResult(winner);
      return true;
    }

    if (board.every(c => c !== EMPTY)) {
      gameOver = true;
      scores.draw++;
      renderScores();
      animateScore(scoreDrawEl);
      showResult('draw');
      return true;
    }

    return false;
  }

  function switchTurn() {
    currentTurn = currentTurn === X ? O : X;
    turnIndicator.classList.add('switching');
    setTimeout(() => {
      renderTurn();
      turnIndicator.classList.remove('switching');
    }, 150);
  }

  function triggerAI() {
    if (gameOver || currentTurn !== AI_MARK) return;
    aiThinking = true;
    gameBoard.classList.add('locked');
    renderTurn();

    const delay = difficulty === 'hard' ? 450 : difficulty === 'medium' ? 320 : 220;

    setTimeout(() => {
      if (gameOver) { aiThinking = false; gameBoard.classList.remove('locked'); return; }
      const move = getAIMove([...board]);
      if (move === -1) { aiThinking = false; gameBoard.classList.remove('locked'); return; }

      board[move] = currentTurn;
      moveNumber++;
      lastMoveIdx = move;
      renderBoard();
      aiThinking = false;
      gameBoard.classList.remove('locked');

      if (!checkEnd()) switchTurn();
    }, delay);
  }

  // Track mouse position for ripple effect
  cells.forEach(cell => {
    cell.addEventListener('mousemove', (e) => {
      const rect = cell.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(0);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(0);
      cell.style.setProperty('--ripple-x', x + '%');
      cell.style.setProperty('--ripple-y', y + '%');
    });
  });

  function handleCellClick(e) {
    if (gameOver || aiThinking) return;
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    if (board[idx] !== EMPTY) return;
    if (gameMode === 'ai' && currentTurn !== HUMAN) return;

    board[idx] = currentTurn;
    moveNumber++;
    lastMoveIdx = idx;
    renderBoard();

    if (checkEnd()) return;
    switchTurn();

    if (gameMode === 'ai' && currentTurn === AI_MARK) triggerAI();
  }

  function resetBoard() {
    board = Array(9).fill(EMPTY);
    currentTurn = X;
    gameOver = false;
    aiThinking = false;
    moveNumber = 0;
    lastMoveIdx = -1;
    gameBoard.classList.remove('locked');
    hideResult();
    hideWinLine();
    renderBoard();
    renderTurn();
    roundNumber++;
    updateRoundBadge();
    playBoardEntrance();
  }

  function resetScores() {
    scores = { x: 0, o: 0, draw: 0 };
    roundNumber = 0;
    renderScores();
    resetBoard();
  }

  // ── Events ─────────────────────────────────────────────────────────
  cells.forEach(cell => cell.addEventListener('click', handleCellClick));
  btnPlayAgain.addEventListener('click', resetBoard);
  btnReset.addEventListener('click', resetBoard);
  btnResetScores.addEventListener('click', resetScores);

  resultOverlay.addEventListener('click', (e) => {
    if (e.target === resultOverlay) resetBoard();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resultOverlay.classList.contains('visible')) resetBoard();
  });

  // ── Init ───────────────────────────────────────────────────────────
  renderBoard();
  renderTurn();
  renderScores();
})();

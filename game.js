/* ===================================================================
   Tic Tac Toe — Game Logic + AI Engine
   
   Evaluation logic ported from the Python notebook (evaluate function)
   that checks rows, columns, and diagonals for X / O victory.
   
   AI Difficulty:
     Easy   — random moves
     Medium — 40% minimax, 60% random
     Hard   — full minimax (unbeatable)
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
  const modeScreen   = document.getElementById('mode-screen');
  const gameScreen   = document.getElementById('game-screen');
  const btnModePvp   = document.getElementById('btn-mode-pvp');
  const btnModeAi    = document.getElementById('btn-mode-ai');
  const diffSection  = document.getElementById('difficulty-section');
  const diffBtns     = document.querySelectorAll('.diff-btn');
  const btnStartGame = document.getElementById('btn-start-game');

  // ── DOM — Game Screen ─────────────────────────────────────────────
  const cells          = document.querySelectorAll('.cell');
  const gameBoard      = document.getElementById('game-board');
  const turnIndicator  = document.getElementById('turn-indicator');
  const turnSymbol     = document.getElementById('turn-symbol');
  const turnText       = document.getElementById('turn-text');
  const scoreXEl       = document.getElementById('score-x');
  const scoreOEl       = document.getElementById('score-o');
  const scoreDrawEl    = document.getElementById('score-draw');
  const scoreCardX     = document.getElementById('score-card-x');
  const scoreCardO     = document.getElementById('score-card-o');
  const labelX         = document.getElementById('label-x');
  const labelO         = document.getElementById('label-o');
  const modeTag        = document.getElementById('mode-tag');
  const resultOverlay  = document.getElementById('result-overlay');
  const resultTitle    = document.getElementById('result-title');
  const resultSub      = document.getElementById('result-sub');
  const btnPlayAgain   = document.getElementById('btn-play-again');
  const btnReset       = document.getElementById('btn-reset');
  const btnResetScores = document.getElementById('btn-reset-scores');
  const btnChangeMode  = document.getElementById('btn-change-mode');
  const winLineSvg     = document.getElementById('win-line-svg');
  const winLine        = document.getElementById('win-line');

  // ══════════════════════════════════════════════════════════════════
  //  MODE SELECTION
  // ══════════════════════════════════════════════════════════════════

  btnModePvp.addEventListener('click', () => {
    gameMode = 'pvp';
    btnModePvp.classList.add('active');
    btnModeAi.classList.remove('active');
    diffSection.classList.add('hidden');
  });

  btnModeAi.addEventListener('click', () => {
    gameMode = 'ai';
    btnModeAi.classList.add('active');
    btnModePvp.classList.remove('active');
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
      modeTag.textContent = 'vs AI / ' + labels[difficulty];
    } else {
      labelX.textContent = 'X';
      labelO.textContent = 'O';
      modeTag.textContent = '2 Players';
    }

    scores = { x: 0, o: 0, draw: 0 };
    modeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    resetBoard();
    renderScores();
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
      cell.classList.remove(X, O, 'taken', 'winner');
      if (board[i] === X) {
        cell.textContent = 'X';
        cell.classList.add(X, 'taken');
      } else if (board[i] === O) {
        cell.textContent = 'O';
        cell.classList.add(O, 'taken');
      } else {
        cell.textContent = '';
      }
    });
  }

  function renderTurn() {
    turnIndicator.classList.remove('x-turn', 'o-turn', 'ai-thinking');

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

    scoreCardX.classList.toggle('active', currentTurn === X && !gameOver);
    scoreCardO.classList.toggle('active', currentTurn === O && !gameOver);
  }

  function renderScores() {
    scoreXEl.textContent    = scores.x;
    scoreOEl.textContent    = scores.o;
    scoreDrawEl.textContent = scores.draw;
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
    const msg = gameMode === 'ai'
      ? { x: { t: 'You win',    s: '',  c: 'x-win' },
          o: { t: 'AI wins',    s: '',  c: 'o-win' },
          draw: { t: 'Draw',    s: '',  c: 'draw'  } }
      : { x: { t: 'X wins',    s: '',  c: 'x-win' },
          o: { t: 'O wins',    s: '',  c: 'o-win' },
          draw: { t: 'Draw',   s: '',  c: 'draw'  } };

    const m = msg[winner];
    resultTitle.textContent = m.t;
    resultTitle.className   = 'result-title ' + m.c;
    resultSub.textContent   = m.s;

    setTimeout(() => resultOverlay.classList.add('visible'), 500);
  }

  function hideResult() {
    resultOverlay.classList.remove('visible');
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
      showResult('draw');
      return true;
    }

    return false;
  }

  function switchTurn() {
    currentTurn = currentTurn === X ? O : X;
    renderTurn();
  }

  function triggerAI() {
    if (gameOver || currentTurn !== AI_MARK) return;
    aiThinking = true;
    gameBoard.classList.add('locked');
    renderTurn();

    const delay = difficulty === 'hard' ? 420 : difficulty === 'medium' ? 300 : 200;

    setTimeout(() => {
      if (gameOver) { aiThinking = false; gameBoard.classList.remove('locked'); return; }
      const move = getAIMove([...board]);
      if (move === -1) { aiThinking = false; gameBoard.classList.remove('locked'); return; }

      board[move] = currentTurn;
      renderBoard();
      aiThinking = false;
      gameBoard.classList.remove('locked');

      if (!checkEnd()) switchTurn();
    }, delay);
  }

  function handleCellClick(e) {
    if (gameOver || aiThinking) return;
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    if (board[idx] !== EMPTY) return;
    if (gameMode === 'ai' && currentTurn !== HUMAN) return;

    board[idx] = currentTurn;
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
    gameBoard.classList.remove('locked');
    hideResult();
    hideWinLine();
    renderBoard();
    renderTurn();
  }

  function resetScores() {
    scores = { x: 0, o: 0, draw: 0 };
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

// ✅ CHESS GAME - FIX CHECKMATE DETECTION, BLOCK ILLEGAL MOVES ✅

// Variables globales
let selectedPiece = null;
let selectedPos = null;
let legalMoves = [];
let currentPlayer = 'w'; // w = white, b = black
let whiteTime = 300; // 5 minutes en secondes
let blackTime = 300;
let timerInterval;
let gameOver = false;
let whiteKingMoved = false;
let blackKingMoved = false;
let whiteRookLeftMoved = false;
let whiteRookRightMoved = false;
let blackRookLeftMoved = false;
let blackRookRightMoved = false;

const canvas = document.getElementById('chessboard');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 60;
const ROWS = 8;
const COLS = 8;

const lightColor = '#f0d9b5';
const darkColor = '#b58863';

const board = [
    ['br','bn','bb','bq','bk','bb','bn','br'],
    ['bp','bp','bp','bp','bp','bp','bp','bp'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['wp','wp','wp','wp','wp','wp','wp','wp'],
    ['wr','wn','wb','wq','wk','wb','wn','wr']
];

const pieceImages = {};
const pieces = ['wp','wr','wn','wb','wq','wk','bp','br','bn','bb','bq','bk'];

function loadPieces() {
  let loaded = 0;
  pieces.forEach(piece => {
    const img = new Image();
    img.src = `assets/${piece}.png`;
    img.onload = () => {
      pieceImages[piece] = img;
      loaded++;
      if (loaded === pieces.length) {
        drawAll();
      }
    };
  });
}

function drawAll() {
  drawBoard();
  drawPieces();
}

function drawBoard() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const isLight = (row + col) % 2 === 0;
      ctx.fillStyle = isLight ? lightColor : darkColor;
      ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

function drawPieces() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const piece = board[row][col];
      if (piece !== '') {
        const img = pieceImages[piece];
        ctx.drawImage(img, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);

  handleClick(row, col);
});

function getFilteredLegalMoves(row, col) {
  const moves = getLegalMoves(row, col);
  const legalFilteredMoves = [];

  moves.forEach(move => {
    const tempBoard = makeMoveCopy(board, {
      from: { row, col },
      to: move
    });

    if (!isKingInCheck(tempBoard, currentPlayer)) {
      legalFilteredMoves.push(move);
    }
  });

  return legalFilteredMoves;
}

function handleClick(row, col) {
  if (gameOver) return;

  const piece = board[row][col];

  if (!selectedPiece) {
    if (piece && piece[0] === currentPlayer) {
      selectedPiece = piece;
      selectedPos = { row, col };
      legalMoves = getFilteredLegalMoves(row, col);
      highlightMoves(legalMoves);
    }
  } else {
    const moveIsLegal = legalMoves.some(move => move.row === row && move.col === col);

    if (moveIsLegal) {
      movePiece(selectedPos, { row, col });
      switchPlayer();
    }

    selectedPiece = null;
    selectedPos = null;
    legalMoves = [];
    drawAll();
  }
}

function movePiece(from, to) {
  const piece = board[from.row][from.col];
  board[to.row][to.col] = piece;
  board[from.row][from.col] = '';

  // ✅ SUITE AU DÉPLACEMENT, MET À JOUR LES FLAGS :
  if (piece === 'wk') whiteKingMoved = true;
  if (piece === 'bk') blackKingMoved = true;

  if (piece === 'wr' && from.row === 7 && from.col === 0) whiteRookLeftMoved = true;
  if (piece === 'wr' && from.row === 7 && from.col === 7) whiteRookRightMoved = true;

  if (piece === 'br' && from.row === 0 && from.col === 0) blackRookLeftMoved = true;
  if (piece === 'br' && from.row === 0 && from.col === 7) blackRookRightMoved = true;

  // ✅ ROQUE → DÉPLACER LA TOUR :
  // Roque Blanc
  if (piece === 'wk' && Math.abs(from.col - to.col) === 2) {
    // Petit Roque
    if (to.col === 6) {
      board[7][5] = 'wr';
      board[7][7] = '';
    }
    // Grand Roque
    if (to.col === 2) {
      board[7][3] = 'wr';
      board[7][0] = '';
    }
  }

  // Roque Noir
  if (piece === 'bk' && Math.abs(from.col - to.col) === 2) {
    // Petit Roque
    if (to.col === 6) {
      board[0][5] = 'br';
      board[0][7] = '';
    }
    // Grand Roque
    if (to.col === 2) {
      board[0][3] = 'br';
      board[0][0] = '';
    }
  }

  // ✅ PROMOTION DU PION :
  if (piece[1] === 'p' && (to.row === 0 || to.row === 7)) {
    const newPiece = prompt("Promotion ! Choisissez (q)uenn, (r)ook, (b)ishop ou k(n)ight :", "q");
    const promoted = ['q','r','b','n'].includes(newPiece) ? newPiece : 'q';
    board[to.row][to.col] = piece[0] + promoted;
  }
}

function switchPlayer() {
  currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
  startTimer();

  document.getElementById('status').innerText =
    currentPlayer === 'w' ? 'À vous de jouer ! (Blancs)' : 'Tour de l\'IA (Noirs)';

  // VÉRIFIER SI UN ROI EST MORT
  let whiteKingAlive = false;
  let blackKingAlive = false;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col] === 'wk') whiteKingAlive = true;
      if (board[row][col] === 'bk') blackKingAlive = true;
    }
  }

  if (!whiteKingAlive) {
    alert('Le Roi Blanc est capturé ! Noir gagne.');
    gameOver = true;
    clearInterval(timerInterval);
    return;
  }

  if (!blackKingAlive) {
    alert('Le Roi Noir est capturé ! Blanc gagne.');
    gameOver = true;
    clearInterval(timerInterval);
    return;
  }

  if (isCheckmate(board, currentPlayer)) {
    alert(`Échec et Mat ! ${currentPlayer === 'w' ? 'Noir' : 'Blanc'} gagne !`);
    clearInterval(timerInterval);
    gameOver = true;
    return;
  }

  if (isStalemate(board, currentPlayer)) {
    alert("Pat ! Partie nulle.");
    clearInterval(timerInterval);
    gameOver = true;
    return;
  }

  if (currentPlayer === 'b' && !gameOver) {
    setTimeout(() => aiMove(), 500);
  }
}

function isCheckmate(boardState, color) {
  if (!isKingInCheck(boardState, color)) return false;
  const moves = getAllPossibleMoves(boardState, color);
  return moves.length === 0;
}

function isStalemate(boardState, color) {
  if (isKingInCheck(boardState, color)) return false;
  const moves = getAllPossibleMoves(boardState, color);
  return moves.length === 0;
}

function isKingInCheck(boardState, color) {
  let kingPos = null;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const piece = boardState[row][col];
      if (piece === `${color}k`) {
        kingPos = { row, col };
        break;
      }
    }
  }

  if (!kingPos) return true;

  const enemyColor = color === 'w' ? 'b' : 'w';
  const enemyMoves = getAllPossibleMoves(boardState, enemyColor);

  return enemyMoves.some(move => move.to.row === kingPos.row && move.to.col === kingPos.col);
}

function highlightMoves(moves) {
  drawAll();
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 3;
  moves.forEach(move => {
    ctx.strokeRect(move.col * TILE_SIZE, move.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  });
}

function getLegalMoves(row, col) {
  const moves = [];
  const piece = board[row][col];
  if (!piece) return moves;

  const color = piece[0];
  const type = piece[1];

  if (type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;

    if (board[row + dir] && board[row + dir][col] === '') {
      moves.push({ row: row + dir, col: col });
      if (row === startRow && board[row + dir * 2][col] === '') {
        moves.push({ row: row + dir * 2, col: col });
      }
    }

    [-1, 1].forEach(dc => {
      const newCol = col + dc;
      if (board[row + dir] && board[row + dir][newCol] && board[row + dir][newCol][0] !== color) {
        moves.push({ row: row + dir, col: newCol });
      }
    });
  }

  if (type === 'r' || type === 'q') {
    moves.push(...getSlidingMoves(row, col, color, [[1, 0], [-1, 0], [0, 1], [0, -1]]));
  }

  if (type === 'b' || type === 'q') {
    moves.push(...getSlidingMoves(row, col, color, [[1, 1], [1, -1], [-1, 1], [-1, -1]]));
  }

  if (type === 'n') {
    [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]].forEach(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        if (!board[r][c] || board[r][c][0] !== color) {
          moves.push({ row: r, col: c });
        }
      }
    });
  }

  if (type === 'k') {
    [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        if (!board[r][c] || board[r][c][0] !== color) {
          moves.push({ row: r, col: c });
        }
      }
    });
  }

  return moves;
}

function getSlidingMoves(row, col, color, directions) {
  const moves = [];

  directions.forEach(([dr, dc]) => {
    let r = row + dr;
    let c = col + dc;

    while (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      if (board[r][c] === '') {
        moves.push({ row: r, col: c });
      } else {
        if (board[r][c][0] !== color) {
          moves.push({ row: r, col: c });
        }
        break;
      }
      r += dr;
      c += dc;
    }
  });

  return moves;
}

function evaluateBoard(boardState) {
  let score = 0;
  const pieceValues = { 'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 900 };
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const piece = boardState[row][col];
      if (piece) {
        const color = piece[0];
        const type = piece[1];
        const value = pieceValues[type];
        score += (color === 'w') ? value : -value;
      }
    }
  }
  return score;
}

function minimax(boardState, depth, alpha, beta, maximizingPlayer) {
  if (depth === 0) return { score: evaluateBoard(boardState) };
  const color = maximizingPlayer ? 'b' : 'w';
  let allMoves = getAllPossibleMoves(boardState, color);
  if (allMoves.length === 0) return { score: evaluateBoard(boardState) };
  let bestMove;
  if (maximizingPlayer) {
    let maxEval = -Infinity;
    allMoves.forEach(move => {
      const newBoard = makeMoveCopy(boardState, move);
      const eval = minimax(newBoard, depth - 1, alpha, beta, false).score;
      if (eval > maxEval) {
        maxEval = eval;
        bestMove = move;
      }
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) return;
    });
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    allMoves.forEach(move => {
      const newBoard = makeMoveCopy(boardState, move);
      const eval = minimax(newBoard, depth - 1, alpha, beta, true).score;
      if (eval < minEval) {
        minEval = eval;
        bestMove = move;
      }
      beta = Math.min(beta, eval);
      if (beta <= alpha) return;
    });
    return { score: minEval, move: bestMove };
  }
}

function getAllPossibleMoves(boardState, color) {
  const moves = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const piece = boardState[row][col];
      if (piece && piece[0] === color) {
        const legalMoves = getLegalMoves(row, col);
        legalMoves.forEach(dest => {
          moves.push({ from: { row, col }, to: { row: dest.row, col: dest.col } });
        });
      }
    }
  }
  return moves;
}

function makeMoveCopy(boardState, move) {
  const newBoard = boardState.map(row => row.slice());
  const piece = newBoard[move.from.row][move.from.col];
  newBoard[move.from.row][move.from.col] = '';
  newBoard[move.to.row][move.to.col] = piece;
  return newBoard;
}

function aiMove() {
  if (gameOver) return;
  const { move } = minimax(board, 3, -Infinity, Infinity, true);
  if (move) {
    movePiece(move.from, move.to);
    switchPlayer();
    drawAll();
  }
}

loadPieces();
document.getElementById('status').innerText = 'À vous de jouer ! (Blancs)';
startTimer();
document.getElementById('timer').innerText = `Blancs: ${formatTime(whiteTime)} | Noirs: ${formatTime(blackTime)}`;

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (currentPlayer === 'w') whiteTime--;
    else blackTime--;
    document.getElementById('timer').innerText = `Blancs: ${formatTime(whiteTime)} | Noirs: ${formatTime(blackTime)}`;
    if (whiteTime <= 0 || blackTime <= 0) {
      alert('Temps écoulé !');
      clearInterval(timerInterval);
      gameOver = true;
    }
  }, 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

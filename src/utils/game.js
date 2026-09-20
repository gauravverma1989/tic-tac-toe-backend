export function winner(board){const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];for(const [a,b,c] of lines)if(board[a]&&board[a]===board[b]&&board[a]===board[c])return board[a];return null;}
export function validBoard(board){return Array.isArray(board)&&board.length===9&&board.every(v=>v===''||v==='X'||v==='O');}

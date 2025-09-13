//serer connection 
const socket = io('http://localhost:4000')
socket.emit('confirm','JS says this')
socket.on('confirm1',data=>{
  console.log(data)
})

const params = new URLSearchParams(window.location.search);
const room_id = params.get('room')
const player_name = params.get('name')
const opponent_name = params.get('opponentName')


const client_board  =document.getElementById('client_board')
client_cells = document.getElementsByClassName('cell-your-board')
opponent_cells = document.getElementsByClassName(`cell-opponent-board`)
warning_bar = document.getElementById('warning_bar')
const player_name_display = document.getElementById('player_name_label')
const opponent_name_display = document.getElementById('opponent_name_label')

const shipPane = document.getElementById("ship-pane");

player_name_display.innerText = player_name
opponent_name_display.innerText = opponent_name


const row = 15;
const col = 15;

let cell_grid = []


//adding cells to BOARD    
function build_board(board_name){
  for(var i =0;i<row;i++){
    cell_grid[i] = []
    for(var j =0;j<col;j++){
      cell_grid[i][j] = 0
      const cell = document.createElement('div')
      var parent = document.getElementById(board_name)
      cell.classList.add('cell')
      cell.classList.add(`cell-${board_name}`)
      cell.dataset.index = 15*i + j
      parent.appendChild(cell)

      cell.onclick= function(){
        warning_bar.style.display = 'none'
        if(Array.from(this.classList).includes('clicked_cell')){
          return
        }
        var index = this.dataset.index
        var classes = Array.from(this.classList)
        
        if(classes.includes('cell-opponent-board')){
          
          //////CELL CLICK REQ////
          socket.emit('cell_clicked',index)
          window.lastClickedCell = this;
        }
      }
    }
  }

}


build_board('your-board')
build_board('opponent-board')
document.querySelectorAll('.cell').forEach(cell => {
  cell.addEventListener('mouseenter', () => {
    console.log("Hovered cell:", cell.dataset.index);
  });
});
console.log(client_cells)

//adding ship cells to ship pane 
let shipMatrix = [
  [1, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]
];

const shipContainer = document.getElementById("ship-1");

for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 4; c++) {
    if (shipMatrix[r][c] === 1) {
      const cell = document.createElement("div");
      cell.classList.add("ship-cell");
      shipContainer.appendChild(cell);
    } else {
      const empty = document.createElement("div");
      empty.style.background = "transparent";
      shipContainer.appendChild(empty);
    }
  }
}


let startX = 0; let startY = 0;
const ship_cells = Array.from(document.getElementsByClassName('ship-cell'));
let ghost_cell = null;

ship_cells.forEach(cell => {
  cell.addEventListener('mousedown', e => {
    e.preventDefault();

    const rect = cell.getBoundingClientRect();
    cell.style.display = 'none';

    ghost_cell = document.createElement('div');
    ghost_cell.classList.add('ghost-cell');
    ghost_cell.style.width = rect.width + 'px';
    ghost_cell.style.height = rect.height + 'px';
    ghost_cell.style.position = 'absolute';
    ghost_cell.style.background = 'white';
    ghost_cell.style.left = e.clientX - rect.width / 2 + 'px';
    ghost_cell.style.top = e.clientY - rect.height / 2 + 'px';
    ghost_cell.style.pointerEvents = 'none';
    document.body.appendChild(ghost_cell);

    const client_board = document.getElementById('your-board'); // your board

    function mouseMove(e) {
      ghost_cell.style.left = e.clientX - rect.width / 2 + 'px';
      ghost_cell.style.top = e.clientY - rect.height / 2 + 'px';
    }

    function mouseUp(e) {
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', mouseUp);

      // Compute dropped cell
      const boardRect = client_board.getBoundingClientRect();
      const cellSize = boardRect.width / 15; // assuming 15x15 grid
      const col = Math.floor((e.clientX - boardRect.left) / cellSize);
      const row = Math.floor((e.clientY - boardRect.top) / cellSize);

      console.log(`Dropped on row ${row}, col ${col}`);
      cell_grid[row][col] = 1
      index = 15*row + col
      Array.from(client_cells)[index].classList.remove('cell')
      Array.from(client_cells)[index].classList.add('ship-cell')
      console.log(cell_grid)
      console.log(Array.from(client_cells)[index])

      // Clean up
      ghost_cell.remove();
      // cell.style.display = 'block';
      ghost_cell = null;
    }

    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
  });
});







socket.on('opponent_clicked_cell',index=>{
  //updates your board when opponent chooses your cell
  client_cells[index].classList.add('clicked_cell')
})

socket.on('player-alone',bool=>{
  if(bool){
    warning_bar.innerText = 'OPPONENT NOT CONNECTED'
    warning_bar.style.display= 'block'
  }
  
})

socket.on('oppponent joined',name=>{
  opponent_name_display.innerText = name
})


socket.on('turn-evaluation', bool => {
  if (!bool) {
    warning_bar.innerText = 'NOT YOUR TURN';
    warning_bar.style.display = 'block';
  } else {
    // console.log('reaching');
    if (window.lastClickedCell) {
      //update's opponent board ono your screen when you choose a opponent cell
      window.lastClickedCell.classList.add('clicked_cell');
      socket.emit('print-players', room_id);
    }
  }
})

// console.log(params)
// console.log(room_id)
socket.emit('enter-room',[player_name,room_id])
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


client_cells = document.getElementsByClassName('cell-your-board')
opponent_cells = document.getElementsByClassName(`cell-opponent-board`)
warning_bar = document.getElementById('warning_bar')
const player_name_display = document.getElementById('player_name_label')
const opponent_name_display = document.getElementById('opponent_name_label')

player_name_display.innerText = player_name
opponent_name_display.innerText = opponent_name


const row = 15;
const col = 15;


//adding cells to html and cell logic   
function build_board(board_name){
  for(var i =0;i<row;i++){
    for(var j =0;j<col;j++){

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

console.log(client_cells)

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
    console.log('reaching');
    if (window.lastClickedCell) {
      //update's opponent board ono your screen when you choose a opponent cell
      window.lastClickedCell.classList.add('clicked_cell');
      socket.emit('print-players', room_id);
    }
  }
})

console.log(params)
console.log(room_id)
socket.emit('enter-room',[player_name,room_id])
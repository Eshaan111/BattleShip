//serer connection 
const socket = io('http://localhost:4000')
socket.emit('confirm','JS says this')
socket.on('confirm1',data=>{
  console.log(data)
})
const params = new URLSearchParams(window.location.search);
const room_id = params.get('room')

client_cells = document.getElementsByClassName('cell-your-board')
opponent_cells = document.getElementsByClassName(`cell-opponent-board`)
warning_bar = document.getElementById('warning_bar')
console.log(warning_bar)

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


socket.emit('enter-room',room_id)
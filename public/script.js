//serer connection 
const socket = io('http://localhost:4000')
socket.emit('confirm','JS says this')
socket.on('confirm1',data=>{
  console.log(data)
})
const ingame=false;

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
        var classes = Array.from(this.classList)
        if(classes.includes('cell-opponent-board')){
          var index = this.dataset.index
          console.log(client_cells[index])
          this.classList.add('clicked_cell')

          socket.emit('cell_clicked',index)
        }
      }
    }
  }

}

build_board('your-board')
build_board('opponent-board')

client_cells = document.getElementsByClassName('cell-your-board')
opponent_cells = document.getElementsByClassName(`cell-opponent-board`)

console.log(client_cells)

socket.on('opponent_clicked_cell',index=>{
  client_cells[index].classList.add('clicked_cell')
})
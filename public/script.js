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
//cellGrid[row][col] = { occupied: true/false, shipId: X }



//adding cells to BOARD    
function build_board(board_name){
  for(var i =0;i<row;i++){
    cell_grid[i] = []
    for(var j =0;j<col;j++){
      cell_grid[i][j] = {occupied: false, shidId : null}
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

//adding ship cells to ship pane 
let shipMatrix = [
  [1, 0, 0, 0],
  [1, 0, 0, 0],
  [1, 1, 1, 0],
  [0, 0, 0, 0]
];

const shipContainer = document.getElementById("ship-1");
console.log(shipContainer)
// ships = {
//      
//        ship1 : [[1,2],[2,4]] ie indexes of ship cell in matrix
// 
// }

ships = {}
dropped_ships = {}
//dropped_ships = {ship_id: 1, dropp_cell_index = [233,222,123....]]

function render_ship(container,shipMatrix,class_name){
  ship_indexes = []
  var ship_cell_divs = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (shipMatrix[r][c] === 1) {
        const cell = document.createElement("div");
        cell.classList.add(class_name);
        client_cell_rect = client_cells[0].getBoundingClientRect()
        cell.style.width = client_cell_rect.width + 'px'
        cell.style.height = client_cell_rect.height + 'px'
        container.appendChild(cell);
        ship_cell_divs[ship_cell_divs.length] = cell
        ship_indexes[ship_indexes.length] = [r,c]
      } else {
        const empty = document.createElement("div");
        empty.style.background = "transparent";
        container.appendChild(empty);
      }
    }
  }
  //ship_indexes = index of ship in a 4x4 ship-grid-matrix
  return [ship_indexes, ship_cell_divs]

}

var render_output = render_ship(shipContainer,shipMatrix,'ship-cell')
ships[shipContainer] = {shipIndexes : render_output[0], shipCellDivs : render_output[1]}
console.log(ships)


let startX = 0; let startY = 0;
let ghost_cell = null;

function makeShipDraggable(type_of_cell,ship_container=null,place_index_arr = null){
  let ship_cell_arr
  let ship_cell_indexes
  if(type_of_cell=='unplaced'){
    ship_cell_arr = ships[ship_container].shipCellDivs
    ship_cell_indexes = ships[ship_container].shipIndexes
  }
  else{
  
  }
  
  
  ship_cell_arr.forEach(cell=>{
    
    cell.addEventListener('mousedown',e=>{
      
      let anchor_cell_in_arr
      e.preventDefault
      const container_rect = shipContainer.getBoundingClientRect();
      const cell_rect = cell.getBoundingClientRect()
      shipContainer.style.gridTemplateRows = 'repeat(4,20px)'
      shipContainer.style.gridTemplateColumns = 'repeat(4,20px)'
      count = 0
      ship_cell_arr.forEach(cell_div => {
        if(cell_div == cell){
          anchor_cell_in_arr = count
        }else{count++}
        cell_div.style.display = 'none'
      });

      anchor_cell = cell
      anchor_cell_index = ships[shipContainer].shipIndexes[anchor_cell_in_arr]
      console.log(anchor_cell_index)

      ghost_container = document.createElement('div')
      ghost_container.classList.add('ghost_container');
      ghost_container.style.width = container_rect.width + 'px';
      ghost_container.style.height = container_rect.height + 'px';
      render_ship(ghost_container,shipMatrix,'ghost_cell')
      ghost_container.style.position = 'absolute';
      ghost_container.style.background = 'transparent';
      ghost_container.style.left = e.clientX - (cell_rect.width /2) - cell_rect.width*anchor_cell_index[1] + 'px';
      ghost_container.style.top = e.clientY - cell_rect.height / 2 - cell_rect.height*anchor_cell_index[0] +'px';
      ghost_container.style.pointerEvents = 'none';
      
      document.body.appendChild(ghost_container);
      
      

      function mouseMove(e){
        ghost_container.style.left = e.clientX - cell_rect.width / 2 - cell_rect.width*anchor_cell_index[1] + 'px';
        ghost_container.style.top = e.clientY - cell_rect.height / 2 - cell_rect.height*anchor_cell_index[0] + 'px';
      }

      function mouseUp(e){
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', mouseUp);

        // element directly under pointer
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el) { restoreOriginal(); return; }

        const cell = el.closest('.cell, .ship-cell');     // adapt to your classes
        if (!cell || !client_board.contains(cell)) {
          // dropped outside board
          restoreOriginal();
          return;
        }

        // read index (you already set data-index = r*COLS + c)
        const index = parseInt(cell.dataset.index, 10);
        if (Number.isNaN(index)) { restoreOriginal(); return; }

        const COLS = 15;
        const row_drop = Math.floor(index / COLS);
        const col_drop = index % COLS;

        console.log('Dropped on row', row_drop, 'col', col_drop);
        arr_dropped_index = []
        //arr dropped index = [[index,row,col],[index,row,col],[index,row,col]] 
        ships[shipContainer].shipIndexes.forEach(index_arr => {

          anchor_shipgrid_row = anchor_cell_index[0]
          anchor_shipgrid_col = anchor_cell_index[1]
          curr_cell_row = index_arr[0]
          curr_cell_col = index_arr[1]
          let new_index = 0
          var col_diff = curr_cell_col - anchor_shipgrid_col
          var row_diff = curr_cell_row - anchor_shipgrid_row
          // console.log(`Anchor row,col = [${anchor_shipgrid_row},${anchor_shipgrid_col}] cell row-col = [${curr_cell_row},${curr_cell_col}], col_diff = [${row_diff},${col_diff}]`)
          new_index += 15*(row_drop + row_diff)
          new_index += col_drop + col_diff
          cell_row_drop = row_drop + row_diff
          cell_col_drop = col_drop + col_diff
          arr_dropped_index[arr_dropped_index.length] = [new_index,cell_row_drop,cell_col_drop]
          console.log(`row = ${cell_row_drop} col ${cell_col_drop}`)
            
        });
        count = 0
        to_place = true
        //checking placement 
        console.log(arr_dropped_index)
        arr_dropped_index.forEach(arr => {
          new_index = arr[0]
          new_row = arr[1]
          new_col = arr[2]
          if(new_row< 0 || new_row>14 ||new_col<0 || new_col>14 || new_index<0 || new_index > 255){
            to_place = false;
            return
          }
        });
        console.log(to_place)

        if(to_place){
          ships[shipContainer].shipIndexes.forEach(index_arr => {

            new_index = arr_dropped_index[count][0]
            cell_row_drop = arr_dropped_index[count][1]
            cell_col_drop = arr_dropped_index[count][2]
            cell_grid[cell_row_drop][cell_col_drop] = {occupied : true, shidId : shipContainer}
            cell_placed = Array.from(client_cells)[new_index]
            cell_placed.classList.remove('cell')
            cell_placed.classList.add('ship-placed-cell')
            count++
          })
        }
        else{
          restoreOriginal()
          return
        }
        ghost_container.remove()
        ghost_container = null
        
        function restoreOriginal(){
          shipContainer.style.gridTemplateColumns = 'repeat(4,auto)'
          shipContainer.style.gridTemplateRows = 'repeat(4,auto)'
          ship_cell_arr.forEach(cell_div => {
            cell_div.style.display = 'block'
          });
          ghost_container.remove()
          ghost_container = null
        }
      }
      document.addEventListener('mousemove',mouseMove)
      document.addEventListener('mouseup',mouseUp)
    })
  })
}

const ship_cells = Array.from(document.getElementsByClassName('ship-cell'));
// ship_cells.forEach(cell => makeCellDraggable(cell));
makeShipDraggable('unplaced',ship_container = shipContainer)






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
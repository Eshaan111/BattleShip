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
//ships = {
//          shipContainer : {shipIndexes : [[a,b],[c,d]] , shipCellDivs : [div1,dov2,div3] }
//        }

dropped_ships = {
  'ship1': {drop_cell_index : [],drop_cell_divs: [],ship_matrix: shipMatrix}
}
//dropped_ships = {ship_id: { drop_cell_index = [233,222,123....], drop_cell_divs = [] }

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


function makeShipDraggable(type_of_cell, ship_container = null, dropped_ship_object = null) {
  let ship_cell_arr;
  let ship_cell_indexes;
  ship_container = shipContainer; // you said you'll handle nulls

  if (type_of_cell === "unplaced") {
    ship_cell_arr = ships[ship_container].shipCellDivs;
    ship_cell_indexes = ships[ship_container].shipIndexes; // relative 4x4 coords
  } else {
    ship_cell_arr = dropped_ship_object["ship1"].drop_cell_divs;
    ship_cell_indexes = dropped_ship_object["ship1"].drop_cell_index; // absolute [index,row,col]
  }

  ship_cell_arr.forEach((cell, i) => {
    if (!cell) return;

    // ✅ Remove old listener if it exists
    if (cell._dragHandler) {
      cell.removeEventListener("mousedown", cell._dragHandler);
    }

    // define handler once
    const handler = (e) => {
      e.preventDefault();

      const container_rect = shipContainer.getBoundingClientRect();
      const cell_rect = cell.getBoundingClientRect();

      if (type_of_cell === "unplaced") {
        ship_container.style.gridTemplateRows = "repeat(4,20px)";
        ship_container.style.gridTemplateColumns = "repeat(4,20px)";
      }

      let anchor_cell_in_arr = ship_cell_arr.indexOf(cell);
      let anchor_cell_index;
      
      if (type_of_cell === "unplaced") {
        anchor_cell_index = ships[ship_container].shipIndexes[anchor_cell_in_arr];
      } else {
        // For placed ships, we need to convert absolute coordinates back to relative
        let abs_coords = ship_cell_indexes[anchor_cell_in_arr];
        // Find the relative position within the ship
        anchor_cell_index = [abs_coords[1] % 4, abs_coords[2] % 4]; // This is a simplified approach
        // Better approach: store original relative coordinates
        anchor_cell_index = ships[ship_container].shipIndexes[anchor_cell_in_arr];
      }

      // hide original cells
      ship_cell_arr.forEach((cell_div) => {
        if (type_of_cell === "unplaced") {
          cell_div.style.display = "none";
        } else {
          cell_div.classList.remove("ship-placed-cell");
          cell_div.classList.add("cell");
        }
      });

      // ghost container
      let ghost_container = document.createElement("div");
      ghost_container.classList.add("ghost_container");
      ghost_container.style.width = container_rect.width + "px";
      ghost_container.style.height = container_rect.height + "px";
      render_ship(ghost_container, shipMatrix, "ghost_cell");
      ghost_container.style.position = "absolute";
      ghost_container.style.background = "transparent";
      ghost_container.style.left =
        e.clientX - cell_rect.width / 2 - cell_rect.width * anchor_cell_index[1] + "px";
      ghost_container.style.top =
        e.clientY - cell_rect.height / 2 - cell_rect.height * anchor_cell_index[0] + "px";
      ghost_container.style.pointerEvents = "none";
      document.body.appendChild(ghost_container);

      // 🔥 IMPORTANT: Define restoreOriginal BEFORE it's used
      function restoreOriginal() {
        if (type_of_cell === "unplaced") {
          ship_container.style.gridTemplateColumns = "repeat(4,auto)";
          ship_container.style.gridTemplateRows = "repeat(4,auto)";
          ship_cell_arr.forEach((cell_div) => {
            cell_div.style.display = "block";
          });
        } else {
          // 🚨 FIX: Properly restore placed ships
          ship_cell_arr.forEach((cell_div) => {
            cell_div.classList.add("ship-placed-cell");
            cell_div.classList.remove("cell");
          });
        }
        ghost_container.remove();
      }

      function mouseMove(e) {
        ghost_container.style.left =
          e.clientX - cell_rect.width / 2 - cell_rect.width * anchor_cell_index[1] + "px";
        ghost_container.style.top =
          e.clientY - cell_rect.height / 2 - cell_rect.height * anchor_cell_index[0] + "px";
      }

      function mouseUp(e) {
        document.removeEventListener("mousemove", mouseMove);
        document.removeEventListener("mouseup", mouseUp);

        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el) return restoreOriginal();

        const targetCell = el.closest(".cell, .ship-cell");
        if (!targetCell || !client_board.contains(targetCell)) {
          return restoreOriginal();
        }

        const index = parseInt(targetCell.dataset.index, 10);
        if (Number.isNaN(index)) return restoreOriginal();

        const COLS = 15;
        const row_drop = Math.floor(index / COLS);
        const col_drop = index % COLS;

        let arr_dropped_index = [];
        let to_place = true;

        ships[ship_container].shipIndexes.forEach((index_arr) => {
          let row_diff = index_arr[0] - anchor_cell_index[0];
          let col_diff = index_arr[1] - anchor_cell_index[1];

          let new_row = row_drop + row_diff;
          let new_col = col_drop + col_diff;
          let new_index = new_row * COLS + new_col;

          if (
            new_row < 0 ||
            new_row >= 15 ||
            new_col < 0 ||
            new_col >= 15 ||
            new_index < 0 ||
            new_index >= 225
          ) {
            to_place = false;
            return;
          }

          arr_dropped_index.push([new_index, new_row, new_col]);
        });

        if (!to_place) return restoreOriginal();

        // 🚨 FIX: Clear old cell_grid data when moving a placed ship
        if (type_of_cell === "placed") {
          ship_cell_indexes.forEach(([old_index, old_row, old_col]) => {
            cell_grid[old_row][old_col] = { occupied: false, shidId: null };
            // 🔥 CRITICAL: Remove drag handlers from old cells
            let old_cell = Array.from(client_cells)[old_index];
            if (old_cell && old_cell._dragHandler) {
              old_cell.removeEventListener("mousedown", old_cell._dragHandler);
              delete old_cell._dragHandler;
            }
          });
        }

        dropped_ship_object = dropped_ships;
        dropped_ship_object["ship1"].drop_cell_index = [];
        dropped_ship_object["ship1"].drop_cell_divs = [];

        arr_dropped_index.forEach(([new_index, r, c]) => {
          cell_grid[r][c] = { occupied: true, shidId: ship_container };
          let cell_placed = Array.from(client_cells)[new_index];
          cell_placed.classList.remove("cell");
          cell_placed.classList.add("ship-placed-cell");

          dropped_ship_object["ship1"].drop_cell_index.push([new_index, r, c]);
          dropped_ship_object["ship1"].drop_cell_divs.push(cell_placed);
        });

        makeShipDraggable("placed", null, dropped_ship_object);

        ghost_container.remove();
      }

      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);
    };

    // ✅ save handler reference so we can remove it later
    cell._dragHandler = handler;
    cell.addEventListener("mousedown", handler);
  });
}
const ship_cells = Array.from(document.getElementsByClassName('ship-cell'));
// ship_cells.forEach(cell => makeCellDraggable(cell));
makeShipDraggable('unplaced','ship1')







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
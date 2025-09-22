//============================================================================
// MULTIPLAYER BATTLESHIP GAME - CLIENT SIDE
// Real-time multiplayer battleship with drag-and-drop ship placement
// Uses Socket.IO for bidirectional communication between players
//============================================================================

//----------------------------------------------------------------------------
// SERVER CONNECTION & INITIAL SETUP
//----------------------------------------------------------------------------

// Establish WebSocket connection to game server
const socket = io('http://localhost:4000')

// Initial handshake to confirm connection
socket.emit('confirm','JS says this')
socket.on('confirm1',data=>{
  console.log(data)
})

// Extract game parameters from URL (allows bookmarking/sharing games)
// Example URL: game.html?room=123&name=Player1&opponentName=Player2
const params = new URLSearchParams(window.location.search);
const room_id = params.get('room')
const player_name = params.get('name')
const opponent_name = params.get('opponentName')

//----------------------------------------------------------------------------
// DOM ELEMENT REFERENCES
//----------------------------------------------------------------------------

// Game boards and UI elements
const your_board = document.getElementById('your-board')                     // Player's defensive board
client_cells = document.getElementsByClassName('cell-your-board')           // Your attack grid
opponent_cells = document.getElementsByClassName(`cell-opponent-board`)     // Enemy's grid to attack
warning_bar = document.getElementById('warning_bar')                        // Status messages
const player_name_display = document.getElementById('player_name_label')
const opponent_name_display = document.getElementById('opponent_name_label')
const shipPane = document.getElementById("ship-pane");                      // Ship placement area

// Initialize player name displays
player_name_display.innerText = player_name
opponent_name_display.innerText = opponent_name

//----------------------------------------------------------------------------
// GAME BOARD CONFIGURATION
//----------------------------------------------------------------------------

// Board dimensions (15x15 - larger than traditional 10x10 Battleship)
const row = 15;
const col = 15;

// 2D array to track game state: occupied cells and ship ownership
let cell_grid = []
// Structure: cellGrid[row][col] = { occupied: true/false, shipId: X }

//----------------------------------------------------------------------------
// DYNAMIC BOARD GENERATION
//----------------------------------------------------------------------------

// Creates interactive game board with click handlers
function build_board(board_name){
  for(var i = 0; i < row; i++){
    cell_grid[i] = []
    for(var j = 0; j < col; j++){
      // Initialize cell state (fixed typo: shipId instead of shidId)
      cell_grid[i][j] = {occupied: false, shipId : null}
      
      // Create DOM cell element
      const cell = document.createElement('div')
      var parent = document.getElementById(board_name)
      cell.classList.add('cell')
      cell.classList.add(`cell-${board_name}`)
      
      // Linear indexing: convert 2D coordinates to single index (15*i + j)
      // This simplifies coordinate calculations throughout the game
      cell.dataset.index = 15*i + j
      parent.appendChild(cell)

      // Click handler for attacking opponent's board
      cell.onclick = function(){
        warning_bar.style.display = 'none'
        
        // Prevent clicking same cell twice
        if(Array.from(this.classList).includes('clicked_cell')){
          return
        }
        
        var index = this.dataset.index
        var classes = Array.from(this.classList)
        
        // Only process clicks on opponent's board
        if(classes.includes('cell-opponent-board')){
          // Send attack to server for validation and processing
          socket.emit('cell_clicked', index)
          window.lastClickedCell = this;  // Track for turn validation
        }
      }
    }
  }
}

// Generate both player boards
build_board('your-board')      // Defensive board (your ships)
build_board('opponent-board')  // Offensive board (attack enemy)
console.log(client_cells)

//----------------------------------------------------------------------------
// SHIP CONFIGURATION & RENDERING
//----------------------------------------------------------------------------

// Define ship shape in 4x4 matrix (1 = ship cell, 0 = empty)
// This represents an L-shaped ship
let empty_matrix = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]
]; 

let shipMatrix1 = [
  [1, 0, 0, 0],
  [1, 0, 0, 0],
  [1, 1, 1, 0],
  [0, 0, 0, 0]
];

let shipMatrix2 = [
  [0, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 1, 1, 1], 
  [0, 1, 0, 0]
];

const shipContainer1 = document.getElementById("ship-1");
const shipContainer2 = document.getElementById("ship-2");
ships = {}
// Structure: ships = { shipContainer : {shipIndexes : [[a,b],[c,d]], shipCellDivs : [div1,div2,div3] } }

dropped_ships = {
  'ship1': {drop_cell_index : [], drop_cell_divs: [], ship_matrix: shipMatrix1},
  'ship2': {drop_cell_index : [], drop_cell_divs: [], ship_matrix: shipMatrix2}, 
}
// Structure: dropped_ships = {ship_id: { drop_cell_index = [233,222,123....], drop_cell_divs = [div1,div2,div3] }







//----------------------------------------------------------------------------
// SHIP RENDERING FUNCTION
//----------------------------------------------------------------------------

// Renders ship based on matrix pattern, returns ship data
function render_ship(container, shipMatrix, class_name){
  var ship_indexes = []      // Relative positions within 4x4 grid
  var ship_cell_divs = []   // DOM elements for ship cells
  
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      client_cell_rect = client_cells[0].getBoundingClientRect()
      if (shipMatrix[r][c] === 1) {
        // Create visible ship cell
        const cell = document.createElement("div");
        cell.classList.add(class_name);
        cell.style.width = client_cell_rect.width + 'px';
        cell.style.height = client_cell_rect.height + 'px';
        // Match cell size to game board cells for consistent appearance        
        container.appendChild(cell);
        ship_cell_divs[ship_cell_divs.length] = cell
        ship_indexes[ship_indexes.length] = [r,c]  // Store relative position
      } else {
        
        if(class_name=='ghost_cell'){
        // Create transparent placeholder to maintain grid structure
        const empty = document.createElement("div");
        empty.style.background = "transparent";
        empty.style.width = client_cell_rect.width + 'px'
        empty.style.height = client_cell_rect.height + 'px'
        container.appendChild(empty);
        }
        else if(class_name =='ship-cell'){
          const empty = document.createElement("div");
          empty.style.background = "transparent";
          empty.style.width = client_cell_rect.width + 'px';
          empty.style.height = client_cell_rect.height + 'px';
          empty.style.border = "1px solid rgba(255, 255, 255, 0.2)";  // Thin white border
          empty.style.borderRadius = "3px";  // Match ship cell border radius/
          empty.style.boxSizing = "border-box";  // Include border in size calculations
          container.appendChild(empty);
        }
      
      }
    }
  }
  
  return [ship_indexes, ship_cell_divs]
}

// // Initialize ship in palette
var render_output1 = render_ship(shipContainer1, shipMatrix1, 'ship-cell')
ships['ship1'] = {shipIndexes : render_output1[0], shipCellDivs : render_output1[1]}

var render_output2 = render_ship(shipContainer2, shipMatrix2, 'ship-cell')
ships['ship2'] = {shipIndexes : render_output2[0], shipCellDivs : render_output2[1]}

console.log(ships)

// Initialize ship in palette





//----------------------------------------------------------------------------
// ADVANCED DRAG & DROP SYSTEM
//----------------------------------------------------------------------------

// Global variables for drag operations
let startX = 0; 
let startY = 0;
let ghost_cell = null;

// Sophisticated drag system handling both unplaced and placed ships
function makeShipDraggable(type_of_cell,ship_id, ship_container = null, shipMatrix = null ,dropped_ship_object = null) {
  let ship_cell_arr;
  let ship_cell_indexes;
  
  

  // Determine which ship data to use based on placement state
  if (type_of_cell === "unplaced") {
    ship_cell_arr = ships[ship_id].shipCellDivs;
    ship_cell_indexes = ships[ship_id].shipIndexes; // Relative 4x4 coordinates
  } else {
    ship_cell_arr = dropped_ship_object[ship_id].drop_cell_divs;
    ship_cell_indexes = dropped_ship_object[ship_id].drop_cell_index; // Absolute [index,row,col]
  }

  // Add drag functionality to each ship cell
  ship_cell_arr.forEach((cell, i) => {
    if (!cell) return;

    // Remove existing drag handler to prevent memory leaks
    if (cell._dragHandler) {
      cell.removeEventListener("mousedown", cell._dragHandler);
    }

    // Main drag handler
    const handler = (e) => {
      e.preventDefault();

      // Get positioning references for drag calculations
      const container_rect = shipContainer1.getBoundingClientRect();
      const cell_rect = cell.getBoundingClientRect();

      // Adjust container grid for dragging
      if (type_of_cell === "unplaced") {
        // ship_container.style.gridTemplateRows = "repeat(4,20px)";
        // ship_container.style.gridTemplateColumns = "repeat(4,20px)";
        ship_container.innerHTML = ''
        render_ship(ship_container,empty_matrix,'ship-cell')
      }

      // Determine anchor cell (the cell being dragged)
      let anchor_cell_in_arr = ship_cell_arr.indexOf(cell);
      let anchor_cell_index;
      
      if (type_of_cell === "unplaced") {
        anchor_cell_index = ships[ship_id].shipIndexes[anchor_cell_in_arr];
      } else {
        // For placed ships, convert absolute back to relative coordinates
        let abs_coords = ship_cell_indexes[anchor_cell_in_arr];
        anchor_cell_index = [abs_coords[1] % 4, abs_coords[2] % 4];
        // Better approach: store original relative coordinates
        anchor_cell_index = ships[ship_id].shipIndexes[anchor_cell_in_arr];
      }

      // Hide original ship during drag
      ship_cell_arr.forEach((cell_div) => {
        if (type_of_cell === "unplaced") {
          cell_div.style.display = "none";
        } else {
          cell_div.classList.remove("ship-placed-cell");
          cell_div.classList.add("cell");
        }
      });

      // Create ghost container for visual feedback during drag
      let ghost_container = document.createElement("div");
      ghost_container.classList.add("ghost_container");
      ghost_container.style.width = container_rect.width + "px";
      ghost_container.style.height = container_rect.height + "px";
      render_ship(ghost_container, shipMatrix, "ghost_cell");
      ghost_container.style.position = "absolute";
      ghost_container.style.background = "transparent";
      
      // Position ghost relative to anchor cell
      ghost_container.style.left =
        e.clientX - cell_rect.width / 2 - cell_rect.width * anchor_cell_index[1] + "px";
      ghost_container.style.top =
        e.clientY - cell_rect.height / 2 - cell_rect.height * anchor_cell_index[0] + "px";
      ghost_container.style.pointerEvents = "none";
      document.body.appendChild(ghost_container);

      // Function to restore original ship state if drop fails
      function restoreOriginal() {
        if (type_of_cell === "unplaced") {
          ship_container.innerHTML = ''
          render_ship(ship_container,shipMatrix,'ship-cell')
        } else {
          // Properly restore placed ships
          ship_cell_arr.forEach((cell_div) => {
            cell_div.classList.add("ship-placed-cell");
            cell_div.classList.remove("cell");
          });
        }
        ghost_container.remove();
      }

      // Mouse movement handler - update ghost position
      function mouseMove(e) {
        ghost_container.style.left =
          e.clientX - cell_rect.width / 2 - cell_rect.width * anchor_cell_index[1] + "px";
        ghost_container.style.top =
          e.clientY - cell_rect.height / 2 - cell_rect.height * anchor_cell_index[0] + "px";
      }

      // Mouse release handler - attempt to place ship
      function mouseUp(e) {
        document.removeEventListener("mousemove", mouseMove);
        document.removeEventListener("mouseup", mouseUp);

        // Find drop target
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el) return restoreOriginal();

        const targetCell = el.closest(".cell, .ship-cell");
        
        // FIXED: Check if target is within the player's board (your-board only)
        if (!targetCell || !your_board || !your_board.contains(targetCell)) {
          return restoreOriginal();
        }

        // Get target cell coordinates
        const index = parseInt(targetCell.dataset.index, 10);
        if (Number.isNaN(index)) return restoreOriginal();

        const COLS = 15;
        const row_drop = Math.floor(index / COLS);
        const col_drop = index % COLS;

        // Calculate all ship cell positions relative to drop point
        let arr_dropped_index = [];
        let to_place = true;

        ships[ship_id].shipIndexes.forEach((index_arr) => {
          let row_diff = index_arr[0] - anchor_cell_index[0];
          let col_diff = index_arr[1] - anchor_cell_index[1];

          let new_row = row_drop + row_diff;
          let new_col = col_drop + col_diff;
          let new_index = new_row * COLS + new_col;

          // Validate ship placement bounds
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

        // Clear old cell_grid data when moving a placed ship
        if (type_of_cell === "placed") {
          ship_cell_indexes.forEach(([old_index, old_row, old_col]) => {
            cell_grid[old_row][old_col] = { occupied: false, shipId: null };
            // Remove drag handlers from old cells
            let old_cell = Array.from(client_cells)[old_index];
            if (old_cell && old_cell._dragHandler) {
              old_cell.removeEventListener("mousedown", old_cell._dragHandler);
              delete old_cell._dragHandler;
            }
          });
        }

        // Update dropped_ships data structure
        dropped_ship_object = dropped_ships;
        dropped_ship_object[ship_id].drop_cell_index = [];
        dropped_ship_object[ship_id].drop_cell_divs = [];

        // Place ship on new coordinates
        arr_dropped_index.forEach(([new_index, r, c]) => {
          cell_grid[r][c] = { occupied: true, shipId: ship_container };
          let cell_placed = Array.from(client_cells)[new_index];
          cell_placed.classList.remove("cell");
          cell_placed.classList.add("ship-placed-cell");

          dropped_ship_object[ship_id].drop_cell_index.push([new_index, r, c]);
          dropped_ship_object[ship_id].drop_cell_divs.push(cell_placed);
        });

        // Re-enable dragging for newly placed ship
        makeShipDraggable("placed", ship_id, ship_container, shipMatrix, dropped_ship_object);
        ghost_container.remove();
      }

      // Attach mouse event listeners
      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);
    };

    // Store handler reference for cleanup
    cell._dragHandler = handler;
    cell.addEventListener("mousedown", handler);
  });
}

// Initialize dragging for unplaced ships4
const ship_cells = Array.from(document.getElementsByClassName('ship-cell'));


makeShipDraggable('unplaced', 'ship1', shipContainer1, shipMatrix1, dropped_ships)
makeShipDraggable('unplaced', 'ship2', shipContainer2, shipMatrix2, dropped_ships)






//----------------------------------------------------------------------------
// SOCKET EVENT HANDLERS - REAL-TIME GAME STATE
//----------------------------------------------------------------------------

// Handle opponent's attacks on your board
socket.on('opponent_clicked_cell', index => {
  // Visual feedback when opponent attacks your cells
  client_cells[index].classList.add('clicked_cell')
})

// Connection status monitoring
socket.on('player-alone', bool => {
  if(bool){
    warning_bar.innerText = 'OPPONENT NOT CONNECTED'
    warning_bar.style.display= 'block'
  }
})

// Opponent connection notification
socket.on('oppponent joined', name => {
  opponent_name_display.innerText = name
})

// Turn validation and attack processing
socket.on('turn-evaluation', bool => {
  if (!bool) {
    // Not player's turn - show warning
    warning_bar.innerText = 'NOT YOUR TURN';
    warning_bar.style.display = 'block';
  } else {
    // Valid turn - process attack
    if (window.lastClickedCell) {
      // Update opponent board on your screen when you attack
      window.lastClickedCell.classList.add('clicked_cell');
      socket.emit('print-players', room_id);
    }
  }
})

//----------------------------------------------------------------------------
// GAME INITIALIZATION
//----------------------------------------------------------------------------

// Join game room with player credentials
socket.emit('enter-room', [player_name, room_id])

//============================================================================
// END OF CLIENT-SIDE BATTLESHIP GAME
// This implementation provides:
// - Real-time multiplayer gameplay via WebSocket
// - Sophisticated drag-and-drop ship placement
// - Turn-based attack system with server validation  
// - Visual feedback for game state changes
// - Scalable room-based architecture
//============================================================================

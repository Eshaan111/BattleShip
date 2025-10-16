//============================================================================
// MULTIPLAYER BATTLESHIP GAME - CLIENT SIDE
// Real-time multiplayer battleship with drag-and-drop ship placement
// Uses Socket.IO for bidirectional communication between players
//============================================================================

//----------------------------------------------------------------------------
// SERVER CONNECTION & INITIAL SETUP
//----------------------------------------------------------------------------

// Establish WebSocket connection to game server
const socket = io()
// const socket = io('http://localhost:4000')

// Initial handshake to confirm connection
socket.emit('confirm', 'JS says this')
socket.on('confirm1', data => {
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
const client_cells = document.getElementsByClassName('cell-your-board')           // Your attack grid
const warning_bar = document.getElementById('warning_bar')                        // Status messages
const player_ready_label = document.getElementById('player-ready-status')
const opponent_ready_label = document.getElementById('opponent-ready-status')
const player_name_display = document.getElementById('player_name_label')
const opponent_name_display = document.getElementById('opponent_name_label')
const opponent_connection_label = document.getElementById('opponent_connection_status')
const shipPane = document.getElementById("ship-pane");                      // Ship placement area
const ready_button = document.getElementById('ready_button');
const opp_turn_label = document.getElementById('opp-turn-label')
const my_turn_label = document.getElementById('my-turn-label')
const chat_close_btn = document.getElementById('chat-close')
const chat_icon = document.getElementById('chat-icon')
const chat_pane = document.getElementById('chat-pane')
const chat_input = document.getElementById('chat-input')
const chat_send_btn = document.getElementById('chat-send')
const chat_body = document.getElementById('chat-body')
// Initialize player name displays
player_name_display.innerText = player_name;
(opponent_name == 'invalid') ? opponent_name_display.innerText = '<Opponent-Not-Joined>' : opponent_name_display.innerText = opponent_name

if (opponent_name == 'invalid') {
    opponent_name_display.innerText = '<Opponent-Not-Joined>'
    opponent_connection_label.style.display = 'block'
}
else {
    opponent_name_display.innerText = opponent_name;
}

//----------------------------------------------------------------------------
// GAME BOARD CONFIGURATION
//----------------------------------------------------------------------------

// Board dimensions (15x15 - larger than traditional 10x10 Battleship)
const row = 15;
const col = 15;

// 2D array to track game state: occupied cells and ship ownership
let cell_grid = []
let opp_cell_grid = []
// Structure: cellGrid[row][col] = { occupied: true/false, shipId: X, attacked : true/false }

//----------------------------------------------------------------------------
// DYNAMIC BOARD GENERATION
//----------------------------------------------------------------------------

// Creates interactive game board with click handlers
function build_board(board_name, grid_to_map = null, game_end = null) {
    // console.log(`parameter grid = ${grid_to_map}`)
    for (var i = 0; i < row; i++) {
        if (!grid_to_map) {
            (board_name == 'your-board') ? cell_grid[i] = [] : opp_cell_grid[i] = []
        }
        for (var j = 0; j < col; j++) {
            // Initialize cell state (fixed typo: shipId instead of shidId)
            if (!grid_to_map) {
                if (board_name == 'your-board') {
                    cell_grid[i][j] = { occupied: false, shipId: null, attacked: false }
                }
                else {
                    opp_cell_grid[i][j] = { occupied: false, shipId: null, attacked: false }
                }
            }
            else {
                opp_cell_grid[i][j] = grid_to_map[i][j]
            }

            // Create DOM cell element
            const cell = document.createElement('div')
            var parent = document.getElementById(board_name)
            cell.classList.add('cell')
            cell.classList.add(`cell-${board_name}`);
            // if (grid_to_map && grid_to_map[i][j].occupied == true) { cell.classList.add('clicked_cell') }
            if (game_end == 1 && grid_to_map[i][j] == 1) { cell.classList.remove('cell'); cell.classList.add('attacked_ship_cell') }
            if (game_end == 0 && grid_to_map[i][j] == 1) { cell.classList.remove('cell'); cell.classList.add('clicked_cell') }

            // Linear indexing: convert 2D coordinates to single index (15*i + j)
            // This simplifies coordinate calculations throughout the game
            cell.dataset.index = 15 * i + j
            parent.appendChild(cell)

            // Click handler for attacking opponent's board
            cell.onclick = function () {
                warning_bar.style.display = 'none'

                // Prevent clicking same cell twice
                class_arr = Array.from(this.classList)
                if (class_arr.includes('destroyed_ship_cell') || class_arr.includes('clicked_blank_cell') || class_arr.includes('attacked_ship_cell')) {
                    return
                }

                var index = this.dataset.index
                var classes = Array.from(this.classList)

                // Only process clicks on opponent's board
                if (classes.includes('cell-opponent-board')) {
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
// console.log(client_cells)
// console.log(cell_grid)
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

let shipMatrix3 = [
    [0, 1, 1, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 1, 0]
];
let shipMatrix4 = [
    [1, 1, 1, 1],
    [0, 1, 0, 0],
    [0, 1, 1, 1],
    [0, 1, 0, 0]
];
let shipMatrix5 = [
    [0, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 1, 1],
    [1, 1, 1, 1]
];

let emptyMatrix = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

]

let winMatrix = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0],
    [0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0],
    [0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
]


let loseMatrix = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
    [1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0],
    [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
]


const shipContainer1 = document.getElementById("ship-1");
const shipContainer2 = document.getElementById("ship-2");
const shipContainer3 = document.getElementById("ship-3");
const shipContainer4 = document.getElementById("ship-4");
const shipContainer5 = document.getElementById("ship-5");
ships = {}
// Structure: ships = { shipContainer : {shipIndexes : [[a,b],[c,d]], shipCellDivs : [div1,div2,div3] } }

let dropped_ships = {
    'ship1': { drop_cell_index: [], drop_cell_divs: [], ship_matrix: shipMatrix1 },
    'ship2': { drop_cell_index: [], drop_cell_divs: [], ship_matrix: shipMatrix2 },
    'ship3': { drop_cell_index: [], drop_cell_divs: [], ship_matrix: shipMatrix2 },
    'ship4': { drop_cell_index: [], drop_cell_divs: [], ship_matrix: shipMatrix2 },
    'ship5': { drop_cell_index: [], drop_cell_divs: [], ship_matrix: shipMatrix2 },
}
// Structure: dropped_ships = {ship_id: { drop_cell_index = [233,222,123....], drop_cell_divs = [div1,div2,div3] }







//----------------------------------------------------------------------------
// SHIP RENDERING FUNCTION
//----------------------------------------------------------------------------

// Renders ship based on matrix pattern, returns ship data
function render_ship(container, shipMatrix, class_name) {
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
                ship_indexes[ship_indexes.length] = [r, c]  // Store relative position
            } else {

                if (class_name == 'ghost_cell') {
                    // Create transparent placeholder to maintain grid structure
                    const empty = document.createElement("div");
                    empty.style.background = "transparent";
                    empty.style.width = client_cell_rect.width + 'px'
                    empty.style.height = client_cell_rect.height + 'px'
                    container.appendChild(empty);
                }
                else if (class_name == 'ship-cell') {
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
ships['ship1'] = { shipIndexes: render_output1[0], shipCellDivs: render_output1[1] }

var render_output2 = render_ship(shipContainer2, shipMatrix2, 'ship-cell')
ships['ship2'] = { shipIndexes: render_output2[0], shipCellDivs: render_output2[1] }

var render_output3 = render_ship(shipContainer3, shipMatrix3, 'ship-cell')
ships['ship3'] = { shipIndexes: render_output3[0], shipCellDivs: render_output3[1] }

var render_output4 = render_ship(shipContainer4, shipMatrix4, 'ship-cell')
ships['ship4'] = { shipIndexes: render_output4[0], shipCellDivs: render_output4[1] }

var render_output5 = render_ship(shipContainer5, shipMatrix5, 'ship-cell')
ships['ship5'] = { shipIndexes: render_output5[0], shipCellDivs: render_output5[1] }


// console.log(ships)

// Initialize ship in palette





//----------------------------------------------------------------------------
// ADVANCED DRAG & DROP SYSTEM
//----------------------------------------------------------------------------

// Global variables for drag operations
let startX = 0;
let startY = 0;
let ghost_cell = null;

// Sophisticated drag system handling both unplaced and placed ships
function makeShipDraggable(type_of_cell, ship_id, ship_container = null, shipMatrix = null, dropped_ship_object = null) {
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
                render_ship(ship_container, empty_matrix, 'ship-cell')
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
                    var restore_output = render_ship(ship_container, shipMatrix, 'ship-cell')
                    ships[ship_id] = { shipIndexes: restore_output[0], shipCellDivs: restore_output[1] }
                    makeShipDraggable('unplaced', ship_id, ship_container, shipMatrix, dropped_ship_object)
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
                        cell_grid[old_row][old_col] = { occupied: false, shipId: null, attacked: false };
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
                valid_place = true;
                arr_dropped_index.forEach(([new_index, r, c]) => {
                    if (cell_grid[r][c].occupied) { valid_place = false; return }
                });
                if (valid_place) {
                    arr_dropped_index.forEach(([new_index, r, c]) => {
                        cell_grid[r][c] = { occupied: true, shipId: ship_id, attacked: false };
                        let cell_placed = Array.from(client_cells)[new_index];
                        cell_placed.classList.remove("cell");
                        cell_placed.classList.add("ship-placed-cell");

                        dropped_ship_object[ship_id].drop_cell_index.push([new_index, r, c]);
                        dropped_ship_object[ship_id].drop_cell_divs.push(cell_placed);
                    });
                }
                else {
                    return restoreOriginal()
                }
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

function lock_board() {
    Array.from(client_cells).forEach(cell => {
        cell.removeEventListener("mousedown", cell._dragHandler);
    });
}

makeShipDraggable('unplaced', 'ship1', shipContainer1, shipMatrix1, dropped_ships)
makeShipDraggable('unplaced', 'ship2', shipContainer2, shipMatrix2, dropped_ships)
makeShipDraggable('unplaced', 'ship3', shipContainer3, shipMatrix3, dropped_ships)
makeShipDraggable('unplaced', 'ship4', shipContainer4, shipMatrix4, dropped_ships)
makeShipDraggable('unplaced', 'ship5', shipContainer5, shipMatrix5, dropped_ships)

function unlock_board() {

    makeShipDraggable('placed', 'ship1', shipContainer1, shipMatrix1, dropped_ships)
    makeShipDraggable('placed', 'ship2', shipContainer2, shipMatrix2, dropped_ships)
    makeShipDraggable('placed', 'ship3', shipContainer3, shipMatrix3, dropped_ships)
    makeShipDraggable('placed', 'ship4', shipContainer4, shipMatrix4, dropped_ships)
    makeShipDraggable('placed', 'ship5', shipContainer5, shipMatrix5, dropped_ships)
}

// Initialize dragging for unplaced ships4
const ship_cells = Array.from(document.getElementsByClassName('ship-cell'));
let player_ready = false;
function playerReadyUp() {
    if (player_ready == false) {

        warning_bar.style.display = 'none'
        let con_ready = true;
        let warning_mesg;

        Array.from(Object.keys(dropped_ships)).forEach(ship_id => {
            cell_index_arr = dropped_ships[ship_id].drop_cell_index
            if (cell_index_arr.length == 0) {
                con_ready = false
                warning_mesg = 'Ships-remaining'
                return
            }
        })

        if (opponent_name_display.innerText == '<OPPONENT-NOT-JOINED>') {
            con_ready = false
            warning_mesg = 'No opponent'
        }

        if (con_ready) {
            player_ready = true
            player_ready_label.innerText = 'Ready'
            player_ready_label.style.color = '#45a049';

            lock_board()
            console.log('here', cell_grid)

            socket.emit('ready-up', room_id, cell_grid)

            // console.log(player_ready_label.innerText==opponent_ready_label.innerText)
            if (opponent_ready_label.innerText == 'READY' && player_ready_label.innerText == 'READY') {
                console.log('both player ready')
                socket.emit('req-opponent-grid', [room_id, cell_grid])
                ready_button.style.display = 'none'
            }
        } else {
            warning_bar.innerText = warning_mesg
            warning_bar.style.display = 'block'
        }
    }
    else if (opp_cell_grid.length == 0) {
        player_ready = false;
        player_ready_label.innerText = 'Not-Ready';
        player_ready_label.style.color = '#ff4d4d';
        unlock_board()
        socket.emit('player-unready', room_id)

    }

}

function handle_got_cell_clicked(index, class_to_add) {
    console.log('reaching handler')
    let grid_row = parseInt(index / 15);
    let grid_col = index % 15;
    // console.log(cell_grid)
    cell_clicked = cell_grid[grid_row][grid_col]
    console.log('cell_Clicked = ', cell_clicked)
    console.log(client_cells[index])
    if (!cell_clicked.attacked) {
        client_cells[index].classList.add(class_to_add)
        console.log(`ship at row${grid_row} col${grid_col} was changed`)
    }

}

function toggleChat() {
    if (chat_pane.style.display == 'flex') {
        chat_pane.style.display = 'none';
        return
    } else {
        chat_pane.style.display = 'flex'
    }
}

function send_chat() {
    val = chat_input.value
    if (val == '') {
        return
    }
    if (opponent_name == 'invalid') {
        warning_bar.innerText = 'OPPONENT NOT CONNECTED'
        warning_bar.style.display = 'block'
        chat_input.value = ''
        return
    }
    text = `${val}`
    mesg = document.createElement('div')
    mesg.classList.add('chat-message', 'own')
    mesg.innerText = text;
    chat_body.appendChild(mesg)
    chat_input.value = ''
    warning_bar.style.display = 'none'

    socket.emit('sent-mesg', text)
}

//----------------------------------------------------------------------------
// SOCKET EVENT HANDLERS - REAL-TIME GAME STATE
//----------------------------------------------------------------------------

socket.on('get-opponent-grid', grid => {
    // console.log('recieved opponent grid', grid)
    opp_cell_grid = grid
    document.getElementById('opponent-board').innerHTML = ''
    // console.log(opp_cell_grid)
    build_board('opponent-board', opp_cell_grid)

})

// Handle opponent's attacks on your board
socket.on('opponent_clicked_cell', (index, class_to_add) => {
    // Visual feedback when opponent attacks your cells
    handle_got_cell_clicked(index, class_to_add)
})

// Connection status monitoring
socket.on('player-alone', bool => {
    if (bool) {
        warning_bar.innerText = 'OPPONENT NOT CONNECTED'
        warning_bar.style.display = 'block'
    }
})

// Opponent connection notification
socket.on('oppponent joined', name => {
    opponent_name_display.innerText = name
    opponent_connection_label.style.display = 'none'
    warning_bar.style.display = 'none'
})

socket.on('opponent-ready', room_id => {
    opponent_ready_label.innerText = 'Ready'
    opponent_ready_label.style.color = '#45a049'
})
// Turn validation and attack processing
//
socket.on('opponent-unready', room_id => {
    console.log('aithe ', opponent_ready_label)
    opponent_ready_label.innerText = 'not ready'
    opponent_ready_label.style.color = '#ff4d4d'
})

socket.on('my-turn', bool => {
    if (bool) {
        ready_button.style.display = 'none'
        opp_turn_label.innerText = 'Opponent Picking Ship'
        opp_turn_label.style.display = 'none';
        my_turn_label.innerText = 'Attack A Ship'
        my_turn_label.style.display = 'block';
    }

})

socket.on('opp-turn', bool => {
    if (bool) {
        ready_button.style.display = 'none'
        my_turn_label.innerText = 'Attack A Ship'
        my_turn_label.style.display = 'none';
        opp_turn_label.innerText = 'Opponent Picking Ship'
        opp_turn_label.style.display = 'block';
    }

})

socket.on('extra-turn', bool => {
    if (bool) {
        ready_button.style.display = 'none'
        opp_turn_label.innerText = 'Opponent Picking Ship'
        opp_turn_label.style.display = 'none';
        my_turn_label.innerText = 'Correct Guess, Take Another Go'
        my_turn_label.style.display = 'block';
    }

})


socket.on('turn-evaluation', (bool, class_to_add) => {
    if (!bool) {
        // Not player's turn - show warning
        warning_bar.innerText = 'NOT YOUR TURN';
        warning_bar.style.display = 'block';
    } else {
        // Valid turn - process attack
        if (window.lastClickedCell) {
            // Update opponent board on your screen when you attack
            window.lastClickedCell.classList.remove('cell')
            window.lastClickedCell.classList.add(class_to_add);
            if (class_to_add == 'destroyed_ship_cell') {
                index = window
            }


            // socket.emit('print-players', room_id);
        }
    }
})

socket.on('ship-got-destroyed', (board, index) => {
    /// board = whose ship got destroyed 
    console.log(`ship-destroyed of ${board}, index = `, index)
    let grid;
    let cells_arr;
    if (board == 'own') {
        grid = cell_grid
        cells_arr = document.getElementsByClassName('cell-your-board')
    }
    else {
        grid = opp_cell_grid
        cells_arr = document.getElementsByClassName('cell-opponent-board')
    }

    let attack_row = parseInt(parseInt(index) / 15)
    let attack_col = index % 15
    let ship_id = grid[attack_row][attack_col].shipId
    console.log('board_choosed = ', cells_arr)
    console.log('cell =', grid[attack_row][attack_col])
    console.log('ship id = ', ship_id)

    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            if (grid[i][j].shipId == ship_id) {
                let curr_index = (15 * i) + j;
                let cell = cells_arr[curr_index]
                cell.classList.remove('cell')
                cell.classList.remove('clicked_cell')
                cell.classList.remove('attacked_ship_cell')
                cell.classList.add('destroyed_ship_cell')
            }
        }
    }


})

socket.on('recieved-mesg', mesg => {
    text = `${mesg}`
    mesg = document.createElement('div')
    mesg.classList.add('chat-message', 'oher')
    mesg.innerText = text;
    chat_body.appendChild(mesg)
})

socket.on('player-won', room_id => {
    console.log('I WON ')
    document.getElementById('your-board').innerHTML = ''
    document.getElementById('opponent-board').innerHTML = ''

    build_board('your-board', winMatrix, 1)      // Defensive board (your ships)
    build_board('opponent-board', loseMatrix, 0)  // Offensive board (attack enemy)
    lock_board()
})

socket.on('opponent-won', room_id => {
    console.log('OPPONENET WON ')
    document.getElementById('your-board').innerHTML = ''
    document.getElementById('opponent-board').innerHTML = ''

    build_board('your-board', loseMatrix, 0)      // Defensive board (your ships)
    build_board('opponent-board', winMatrix, 1)  // Offensive board (attack enemy)
    lock_board()
})

socket.on('opponent-disconnect', opp_id => {
    console.log(`${opp_id} disconnected `)
    opponent_connection_label.style.display = 'block'
    opponent_ready_label.innertext = 'not ready'
    opponent_ready_label.style.color = '#ff4d4d'
    opponent_name_display.innerText = '<OPPONENT-NOT-JOINED>'
    document.getElementById('opponent-board').innerHTML = ''
    build_board('opponent-board')

    player_ready = false;
    player_ready_label.innerText = 'Not-Ready';
    player_ready_label.style.color = '#ff4d4d';
    unlock_board()
    socket.emit('player-unready', room_id)

    opp_cell_grid = []
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

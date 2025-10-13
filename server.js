const express = require('express')
const socketio = require('socket.io')
const app = express()
const port = process.env.PORT || 4000
const expressServer = app.listen(port)
const io = socketio(expressServer, {})

console.log(`Server started on port ${port}`)

let players = {
    // socket_id : {playerName : <player name>, playerNum : <player's number>, room_id= <room id joined>, is_turn = 0/1,
    //              cell_grid = 2d Array , dropped_indexes= {index : [shipId, attacked(t/f)] }, ship_destroyed : int 
    //  Structure: cellGrid[row][col] = { occupied: true/false, shipId: X, attacked : true/false
    // }
}
app.get('/', (req, res) => {
    console.log('aithe', __dirname)
    res.sendFile(__dirname + '/public/matchmaking.html')
})
app.use(express.static('public'))

function log_players() {
    abc = {}
    Array.from(Object.keys(players)).forEach(key => {
        abc[key] = {}
        abc[key].playerName = players[key].playerName
        abc[key].playerNum = players[key].playerNum
        abc[key].room_id = players[key].room_id
        abc[key].is_turn = players[key].is_turn
        abc[key].dropped_indexes = players[key].dropped_indexes
    });
    console.log(abc, "\nCAUTION :: player[key].cell_grid is not shown here ")
}

function type_of_attack(attacked_on_id, index) {
    let type_cell;
    row = parseInt(index / 15)
    col = index % 15

    console.log('Attack evaluation started', { attacked_on_id, index, row, col })

    dropped_index_obj = players[attacked_on_id].dropped_indexes
    dropped_index_obj_key = Array.from(Object.keys(dropped_index_obj))
    index_is_ship_cell = Array.from(Object.keys(dropped_index_obj).includes(`${index}`))

    if (dropped_index_obj[`${index}`] != undefined) {
        let attacked_ship_id = dropped_index_obj[`${index}`][0]
        let ship_destroyed = true

        console.log(`Ship hit detected`, { attacked_ship_id, currentIndex: index })
        dropped_index_obj[`${index}`][1] = true;

        Array.from(Object.keys(dropped_index_obj)).forEach(key_index => {
            key = `${key_index}`
            ship_id = dropped_index_obj[key][0]
            ship_attacked = dropped_index_obj[key][1]
            if (ship_id == attacked_ship_id && ship_attacked == false) {
                ship_destroyed = false
            }
        });

        if (ship_destroyed) {
            type_cell = 'destroyed_ship_cell'
            console.log('Ship destroyed', { attacked_ship_id })
        }
        else {
            type_cell = 'attacked_ship_cell'
            console.log('Ship damaged', { attacked_ship_id })
        }
        return type_cell
    }

    else {
        type_cell = 'clicked_blank_cell';
        console.log(`Blank cell clicked`, { playerName: players[attacked_on_id].playerName, index })
        return type_cell
    }
}

io.on('connect', socket => {
    console.log(`Socket connected: ${socket.id}`)

    socket.on('confirm', data => {
        console.log(`Confirm message received: ${data}`)
    })
    socket.emit('confirm1', `My id is =>>>> ${socket.id}`)

    socket.on('create-room-req', room_id => {
        console.log(`Room creation requested: ${room_id} by ${socket.id}`)

        for (let socket_id in players) {
            if (players[socket_id].room_id == room_id) {
                console.log(`Room already exists: ${room_id}`)
                socket.emit('room-aldready-exists', room_id)
                return;
            }
        }
        console.log(`Room created: ${room_id}`)
        socket.emit('change-to-game', [room_id, 0, ''])
    })

    socket.on('enter-room', data => {
        const room_id = data[1]
        var player_name = data[0]
        var room_player_count = 0;

        for (id in players) {
            if (players[id].room_id == room_id) { room_player_count++ }
        }

        if (room_player_count == 0) { var turn = 1 }
        if (room_player_count == 1) { var turn = 0 }

        socket.join(room_id)
        player_count = Object.keys(players).length
        players[socket.id] = { playerName: player_name, playerNum: player_count + 1, room_id: room_id, is_turn: turn, cell_grid: null, ship_destroyed: 0 }

        console.log(`Player entered room`, { socketId: socket.id, playerName: player_name, roomId: room_id, turn, totalPlayers: player_count + 1 })
    })

    socket.on('join-room-req', data => {
        var room_id = data[0]
        var name = data[1]
        var room_player_count = 0;

        console.log(`Room join requested: ${room_id} by ${name} (${socket.id})`)

        for (id in players) {
            if (players[id].room_id == room_id) { room_player_count++ }
        }

        if (room_player_count == 0) {
            console.log(`Room does not exist: ${room_id}`)
            socket.emit('room-doesnt-exist', room_id);
            return
        }
        if (room_player_count > 1) {
            console.log(`Room is full: ${room_id}`)
            socket.emit('full-room', room_id);
            return
        }

        if (room_player_count == 1) {
            var opponent_name = ''
            for (play_id in players) {
                if (players[play_id].room_id == room_id && play_id != socket.id) {
                    var opponent_id = play_id
                    io.to(play_id).emit('oppponent joined', name)
                    opponent_name = players[play_id].playerName
                    var opponent_exists = 1
                    console.log(`Opponent joined`, { newPlayer: name, opponent: opponent_name, roomId: room_id })
                    socket.emit('change-to-game', [room_id, opponent_exists, opponent_name])
                    return
                }
            }
        }
    })

    socket.on('cell_clicked', index => {
        var client_room_id = players[socket.id].room_id
        var client_turn = players[socket.id].is_turn
        var opponent_id = '';
        var room_player_count = 0;

        console.log(`Cell clicked`, { socketId: socket.id, cellIndex: index, playerTurn: client_turn })

        Array.from(Object.keys(players)).forEach(id => {
            if (players[id].room_id == client_room_id) { room_player_count++ }
            if (players[id].room_id == client_room_id && id != socket.id) { opponent_id = id }
        });

        if (room_player_count < 2) {
            console.log(`Player alone in room`, { roomId: client_room_id, socketId: socket.id })
            socket.emit('player-alone', true);
            return
        }
        else {
            socket.emit('player-alone', false)
        }

        if (client_turn == 1) {
            let class_to_add = type_of_attack(opponent_id, index)
            let opp_id;

            for (let id in players) {
                if (players[id].room_id == client_room_id && id !== socket.id) {
                    opp_id = id
                    io.to(opp_id).emit('opponent_clicked_cell', index, class_to_add)
                    console.log(`Turn processed`, { attacker: socket.id, defender: opp_id, cellIndex: index, attackType: class_to_add })
                    if (class_to_add == 'destroyed_ship_cell' || class_to_add == "attacked_ship_cell") {
                        players[socket.id].is_turn = 1;
                        players[opp_id].is_turn = 0;
                        socket.emit('turn-evaluation', true, class_to_add)
                        socket.emit('my-turn', true)
                        socket.emit('extra-turn', true)
                        socket.emit('opp-turn', false)
                        io.to(opp_id).emit('my-turn', false)
                    }
                    else {
                        players[socket.id].is_turn = 0;
                        players[opp_id].is_turn = 1;
                        socket.emit('turn-evaluation', true, class_to_add)
                        socket.emit('my-turn', false)
                        socket.emit('opp-turn', true)
                        io.to(opp_id).emit('my-turn', true)

                    }
                }
            }


            if (class_to_add == 'destroyed_ship_cell') {
                socket.emit('ship-got-destroyed', 'opp', index)
                io.to(opp_id).emit('ship-got-destroyed', 'own', index)

                players[socket.id].ship_destroyed = players[socket.id].ship_destroyed + 1
                console.log(`Ship destroyed count updated`, { socketId: socket.id, destroyedShips: players[socket.id].ship_destroyed })

                if (players[socket.id].ship_destroyed == 5) {
                    console.log(`Game won`, { winner: socket.id, winnerName: players[socket.id].playerName, roomId: client_room_id })
                    socket.emit('player-won', players[socket.id].room_id)
                    io.to(opp_id).emit('opponent-won', players[socket.id].room_id)
                }
            }
            return
        }
        else {
            console.log(`Not player's turn`, { socketId: socket.id, expectedTurn: 0, actualTurn: client_turn })
            socket.emit('turn-evaluation', false, null)
            return
        }
    })

    socket.on('ready-up', (room_id, cell_grid) => {
        let opponent_id;
        console.log(`Player ready-up`, { socketId: socket.id, roomId: room_id })

        Array.from(Object.keys(players)).forEach(curr_socket_id => {
            iter_room_id = players[curr_socket_id].room_id
            if (iter_room_id == room_id && curr_socket_id != socket.id) {
                opponent_id = curr_socket_id
                return
            }
        });

        io.to(opponent_id).emit('opponent-ready', room_id)
        players[socket.id].cell_grid = cell_grid;

        if (!players[socket.id].dropped_indexes) players[socket.id].dropped_indexes = {}

        let ship_count = 0
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                cell_obj = cell_grid[i][j]
                if (cell_obj.occupied == true) {
                    index = (15 * i) + j
                    players[socket.id].dropped_indexes[index] = [cell_obj.shipId, false]
                    ship_count++
                }
            }
        }

        console.log(`Grid initialized`, { socketId: socket.id, opponentId: opponent_id, shipsPlaced: ship_count })
        log_players()
    })

    socket.on('player-unready', roomId => {
        console.log(`Player unready`, { socketId: socket.id, roomId })

        let opponent_id
        Array.from(Object.keys(players)).forEach(id => {
            if (players[socket.id].room_id == players[id].room_id && id != socket.id) {
                opponent_id = id
                return
            }
        });

        if (opponent_id && (players[socket.id].cell_grid == null || players[opponent_id].cell_grid == null)) {
            io.to(opponent_id).emit('opponent-unready', opponent_id)
            console.log(`Opponent notified of unready`, { unreadyPlayer: socket.id, notifiedPlayer: opponent_id })
        }

        players[socket.id].dropped_indexes = {}
        players[socket.id].cell_grid = null;
    })

    socket.on('req-opponent-grid', ([room_id, cell_grid]) => {
        console.log(`Opponent grid requested`, { socketId: socket.id, roomId: room_id })

        let opponent_id;
        Array.from(Object.keys(players)).forEach(curr_socket_id => {
            iter_room_id = players[curr_socket_id].room_id
            if (iter_room_id == room_id && curr_socket_id != socket.id) {
                opponent_id = curr_socket_id
            }
            if (players[curr_socket_id].room_id == players[socket.id].room_id && players[curr_socket_id].is_turn == 1) {
                io.to(curr_socket_id).emit('my-turn', true)
            }
            if (players[curr_socket_id].room_id == players[socket.id].room_id && players[curr_socket_id].is_turn == 0) {
                io.to(curr_socket_id).emit('opp-turn', true)
            }
        });

        socket.emit('get-opponent-grid', players[opponent_id].cell_grid)
        io.to(opponent_id).emit('get-opponent-grid', players[socket.id].cell_grid)
        console.log(`Grids exchanged`, { player1: socket.id, player2: opponent_id, roomId: room_id })
        log_players()
    })

    socket.on('print-players', room_id => {
        console.log('Player list request:', players)
    })

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`)

        let opponent_id
        if (players[socket.id]) {
            Array.from(Object.keys(players)).forEach(id => {
                if (players[socket.id].room_id == players[id].room_id && id != socket.id) {
                    opponent_id = id
                    return
                }
            });

            console.log(`Opponent disconnect notification`, { disconnectedPlayer: socket.id, notifiedOpponent: opponent_id })
            io.to(opponent_id).emit('opponent-disconnect', socket.id)
            delete players[socket.id]
            console.log(`Player deleted`, { socketId: socket.id, remainingPlayers: Object.keys(players).length })
        }
    })
})

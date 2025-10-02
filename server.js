const express = require('express')
const socketio = require('socket.io')
const app = express()
const expressServer = app.listen(4000)
const io = socketio(expressServer, {})

let players = {
    // socket_id : {playerName : <player name>, playerNum : <player's number>, room_id= <room id joined>, is_turn = 0/1,
    //              cell_grid = 2d Array , dropped_indexes= {shipid : [indexes]}
    // Structure: cellGrid[row][col] = { occupied: true/false, shipId: X, }
}
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
io.on('connect', socket => {


    socket.on('confirm', data => {
        console.log(data)
    })
    socket.emit('confirm1', `My id is =>>>> ${socket.id}`)

    ////////CREATING ROOM/////////////
    socket.on('create-room-req', room_id => {

        for (let socket_id in players) {
            if (players[socket_id].room_id == room_id) {
                socket.emit('room-aldready-exists', room_id)
                //console.log(`${room_id} was taken`)
                return;

            }
        }
        console.log('changing to game')
        socket.emit('change-to-game', [room_id, 0, ''])
    })
    socket.on('enter-room', data => {
        //data = [player_name,room_id]
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
        players[socket.id] = { playerName: player_name, playerNum: player_count + 1, room_id: room_id, is_turn: turn, cell_grid: null }
        // console.log(players)
    })

    ///JOINING ROOM///
    socket.on('join-room-req', data => {
        var room_id = data[0]
        var name = data[1]
        var room_player_count = 0;
        for (id in players) {
            if (players[id].room_id == room_id) { room_player_count++ }
        }
        if (room_player_count == 0) { socket.emit('room-doesnt-exist', room_id); return }
        if (room_player_count > 1) { socket.emit('full-room', room_id); return }

        if (room_player_count == 1) {
            var opponent_name = ''
            for (play_id in players) {
                if (players[play_id].room_id == room_id && play_id != socket.id) {
                    var opponent_id = play_id
                    io.to(play_id).emit('oppponent joined', name)
                    opponent_name = players[play_id].playerName
                    var opponent_exists = 1
                    socket.emit('change-to-game', [room_id, opponent_exists, opponent_name])
                    return
                }



            }
        }

    })

    socket.on('cell_clicked', index => {

        var client_room_id = players[socket.id].room_id
        var client_turn = players[socket.id].is_turn
        var opponent_id = ''
        //checking number of players in room
        var room_player_count = 0;
        for (id in players) {
            if (players[id].room_id == client_room_id) { room_player_count++ }
        }

        //check if opponent connected 

        if (room_player_count < 2) {
            socket.emit('player-alone', true);
            return
        }
        else {
            socket.emit('player-alone', false)
        }



        //checking turn

        if (client_turn == 1) {
            for (let id in players) {
                console.log('my id = ', client_room_id)
                if (players[id].room_id == client_room_id && id !== socket.id) {
                    //updating opponent client's CLIENT BOARD
                    io.to(id).emit('opponent_clicked_cell', index)
                    opponent_id = id;
                    players[socket.id].is_turn = 0;
                    players[opponent_id].is_turn = 1;
                }
            }
            // console.log('turn-eval-true')
            socket.emit('turn-evaluation', true)
            return
        }
        else {
            // console.log('turn-eval-false')
            socket.emit('turn-evaluation', false)
            return
        }



    })

    socket.on('ready-up', (room_id, cell_grid) => {
        let opponent_id;
        Array.from(Object.keys(players)).forEach(curr_socket_id => {
            iter_room_id = players[curr_socket_id].room_id
            if (iter_room_id == room_id && curr_socket_id != socket.id) {
                opponent_id = curr_socket_id
                return
            }
        });
        io.to(opponent_id).emit('opponent-ready', room_id)
        players[socket.id].cell_grid = cell_grid;

        players[socket.id].dropped_indexes = {}
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                cell_obj = cell_grid[i][j]
                if (cell_obj.occupied == true) {
                    // console.log(cell_obj, cell_obj.shipId)
                    if (!players[socket.id].dropped_indexes[cell_obj.shipId]) {
                        players[socket.id].dropped_indexes[cell_obj.shipId] = []
                    }
                    dropped_index_arr = players[socket.id].dropped_indexes[cell_obj.shipId]
                    dropped_index_arr[dropped_index_arr.length] = (15 * i) + j
                }
            }
        }
        console.log(`$Player {players[socket.id].playerName} is ready, emitting opponent-ready to ${opponent_id}`)
        log_players()

    })

    socket.on('req-opponent-grid', ([room_id, cell_grid]) => {
        let opponent_id;
        Array.from(Object.keys(players)).forEach(curr_socket_id => {
            iter_room_id = players[curr_socket_id].room_id
            if (iter_room_id == room_id && curr_socket_id != socket.id) {
                opponent_id = curr_socket_id
                return
            }
        });
        socket.emit('get-opponent-grid', players[opponent_id].cell_grid)
        io.to(opponent_id).emit('get-opponent-grid', players[socket.id].cell_grid)
        console.log("------------------BOTH PLAYERS READY -------------------------")
        log_players()


    })


    socket.on('print-players', room_id => {
        // console.log(players)
    })

    socket.on('disconnect', () => {
        delete players[socket.id]
        // console.log(`deleteing player ${socket.id}`, players)
    })


})

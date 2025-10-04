const express = require('express')
const socketio = require('socket.io')
const app = express()
const expressServer = app.listen(4000)
const io = socketio(expressServer, {})

let players = {
    // socket_id : {playerName : <player name>, playerNum : <player's number>, room_id= <room id joined>, is_turn = 0/1,
    //              cell_grid = 2d Array , dropped_indexes= {index : [shipId, attacked(t/f)] } 
    //  Structure: cellGrid[row][col] = { occupied: true/false, shipId: X, attacked : true/false
    // }
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

function type_of_attack(attacked_on_id, index) {
    let type_cell;
    row = parseInt(index / 15)
    col = index % 15


    console.log('reaching attack eval')
    console.log('HUHUHUHUHUHUHUHUH', attacked_on_id)
    console.log(players)
    dropped_index_obj = players[attacked_on_id].dropped_indexes
    dropped_index_obj_key = Array.from(Object.keys(dropped_index_obj))
    index_is_ship_cell = Array.from(Object.keys(dropped_index_obj).includes(`${index}`))

    // cell_grid = players[socket.id].cell_grid
    // cell = cell_grid[row][col]
    //
    console.log('dropped_index_obj[`${index}` != undefined] = ', dropped_index_obj[`${index}`] != undefined)
    if (dropped_index_obj[`${index}`] != undefined) {
        type_cell = 'destroyed_ship_cell';
        console.log(`clciked a ship-cell(${index}) on `, players[attacked_on_id].playerName);
        console.log(dropped_index_obj[`${index}`]);
        // dropped_index_obj[`${index}`][1] = true;
        // cell.attacked = true
        return type_cell
    }

    else {
        type_cell = 'clicked_blank_cell';
        console.log(`clicked a blank cell(${index}) on `, players[attacked_on_id].playerName);
        // cell.attacked = true
        return type_cell
    }

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
        var opponent_id = '';
        //checking number of players in room
        var room_player_count = 0;
        console.log('ARE HAN YAHA TO POHOCH RHA HU ')

        Array.from(Object.keys(players)).forEach(id => {
            if (players[id].room_id == client_room_id) { room_player_count++ }
            if (players[id].room_id == client_room_id && id != socket.id) { opponent_id = id }

        });

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
            let class_to_add = type_of_attack(opponent_id, index)
            let opp_id;
            for (let id in players) {
                if (players[id].room_id == client_room_id && id !== socket.id) {
                    //updating opponent client's CLIENT BOARD
                    opp_id = id
                    io.to(opp_id).emit('opponent_clicked_cell', index, class_to_add)
                    players[socket.id].is_turn = 0;
                    players[opp_id].is_turn = 1;
                }
            }
            // console.log('turn-eval-true')
            socket.emit('turn-evaluation', true, class_to_add)
            socket.emit('opp-turn', true)
            io.to(opp_id).emit('my-turn', true)
            return
        }
        else {
            // console.log('turn-eval-false')
            socket.emit('turn-evaluation', false, null)
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

        if (!players[socket.id].dropped_indexes) players[socket.id].dropped_indexes = {}
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                cell_obj = cell_grid[i][j]
                if (cell_obj.occupied == true) {
                    // console.log(cell_obj, cell_obj.shipId)
                    index = (15 * i) + j
                    players[socket.id].dropped_indexes[index] = [cell_obj.shipId, false]
                }
            }
        }
        console.log(`Player ${players[socket.id].playerName} is ready, emitting opponent-ready to ${opponent_id}`)
        log_players()

    })

    socket.on('player-unready', roomId => {
        console.log(`${socket.id} is unready now`)
        both_ready = true
        let opponent_id
        Array.from(Object.keys(players)).forEach(id => {
            if (players[socket.id].room_id == players[id].room_id && id != socket.id) {
                opponent_id = id
                return
            }
        });
        if (players[socket.id].cell_grid == null || players[opponent_id].cell_grid == null) {
            io.to(opponent_id).emit('opponent-unready', opponent_id)
            console.log(`telling ${opponent_id} that ${socket.id} is unready`)
            players[socket.id].dropped_indexes = {}
            players[socket.id].cell_grid = null;

        }
    })

    socket.on('req-opponent-grid', ([room_id, cell_grid]) => {

        console.log("------------------BOTH PLAYERS READY -------------------------")

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
        log_players()





    })


    socket.on('print-players', room_id => {
        console.log(players)
    })

    socket.on('disconnect', () => {
        let opponent_id
        if (players[socket.id]) {
            Array.from(Object.keys(players)).forEach(id => {
                if (players[socket.id].room_id == players[id].room_id && id != socket.id) {
                    opponent_id = id
                    return
                }
            });
            console.log(`emmiting to ${opponent_id} that ${socket.id} dc-ed`)
            io.to(opponent_id).emit('opponent-disconnect', socket.id)
            delete players[socket.id]
            console.log(`deleteing player ${socket.id}`, players)

        }
    })


})

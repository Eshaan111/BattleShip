const express = require('express')
const socketio = require('socket.io')
const app = express()
const expressServer = app.listen(4000)
const io = socketio(expressServer,{})

players= {
    // socket_id : {playerName : <player name>, playerNum : <player's number>, room_id= <room id joined>, is_turn = 0/1} 
}
app.use(express.static('public'))


io.on('connect',socket=>{   
    

    socket.on('confirm',data=>{
        console.log(data)
    })
    socket.emit('confirm1',`My id is =>>>> ${socket.id}`)

    ////////CREATING ROOM/////////////
    socket.on('create-room-req',room_id=>{
        
        for(let socket_id in players){
            if(players[socket_id].room_id==room_id){
                socket.emit('room-aldready-exists',room_id)
                //console.log(`${room_id} was taken`)
                return;

            }
        }
        console.log('changing to game')
        socket.emit('change-to-game',[room_id,0,''])
    })
    
    socket.on('enter-room',data=>{
        //data = [player_name,room_id]
        const room_id = data[1]
        var player_name = data[0] 
        var room_player_count = 0;
        for(id in players){
            if(players[id].room_id == room_id){room_player_count++}
        }
        if(room_player_count==0){var turn = 1}
        if(room_player_count == 1){var turn = 0}

        socket.join(room_id)
        player_count = Object.keys(players).length
        players[socket.id] = {playerName : player_name, playerNum : player_count + 1, room_id: room_id, is_turn : turn}
        console.log(players)
    })

    ///JOINING ROOM///
    socket.on('join-room-req',data=>{
        var room_id = data[0]
        var name = data[1]
        var room_player_count = 0;
        for(id in players){
            if(players[id].room_id == room_id){room_player_count++}
        }
        if(room_player_count == 0 ){socket.emit('room-doesnt-exist',room_id); return}
        if(room_player_count > 1 ){socket.emit('full-room',room_id);return}

        if(room_player_count == 1 ){
            var opponent_name= ''
            for(play_id in players){
                if(players[play_id].room_id == room_id && play_id != socket.id){
                    var opponent_id = play_id
                    io.to(play_id).emit('oppponent joined',name)
                    opponent_name = players[play_id].playerName
                    var opponent_exists = 1
                    socket.emit('change-to-game',[room_id,opponent_exists,opponent_name])
                    return
            }
            
            
            
            }
        }

    })

    socket.on('cell_clicked',index=>{

        var client_room_id = players[socket.id].room_id
        var client_turn = players[socket.id].is_turn
        var opponent_id = ''
        //checking number of players in room
        var room_player_count = 0;
        for(id in players){
            if(players[id].room_id == client_room_id){room_player_count++}
        }

        //check if opponent connected 
        
        if(room_player_count<2){
            socket.emit('player-alone',true);
            return
        }
        else{
            socket.emit('player-alone',false)
        }
        


        //checking turn
        
        if(client_turn==1){
            for(let id in players){
                console.log('my id = ',client_room_id)
            if(players[id].room_id == client_room_id && id!==socket.id){
                //updating opponent client's CLIENT BOARD
                io.to(id).emit('opponent_clicked_cell',index)
                opponent_id = id;
                players[socket.id].is_turn = 0;
                players[opponent_id].is_turn = 1;
                }
            }
            console.log('turn-eval-true')
            socket.emit('turn-evaluation',true)
            return
        }
        else{
            console.log('turn-eval-false')
            socket.emit('turn-evaluation',false)
            return
        }
        
        
    
    })
    
    socket.on('ready-up',room_id=>{
        let opponent_id;
        Array.from(Object.keys(players)).forEach(curr_socket_id => {
            iter_room_id = players[curr_socket_id].room_id
            if (iter_room_id == room_id && curr_socket_id!=socket.id) {
                opponent_id = curr_socket_id
                return
            }
        });
        io.to(opponent_id).emit('opponent-ready',room_id)
        console.log(`emitting ready-up to ${opponent_id}`)

    })

    socket.on('both-player-ready',([room_id,dropped_ships])=>{
        
    })

    socket.on('print-players',room_id=>{
        console.log(players)
    })

    socket.on('disconnect',()=>{
        delete players[socket.id]
        console.log(`deleteing player ${socket.id}`,players)
    })


})

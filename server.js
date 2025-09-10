const express = require('express')
const socketio = require('socket.io')
const app = express()
const expressServer = app.listen(4000)
const io = socketio(expressServer,{})

players= {
    // socket_id : {playerNum : <player's number>, room_id= <room id joined>} 
}
app.use(express.static('public'))


io.on('connect',socket=>{   
    

    socket.on('confirm',data=>{
        console.log(data)
    })
    socket.emit('confirm1','servers sauyst hits')

    ////////CREATING ROOM/////////////
    socket.on('create-room-req',room_id=>{
        
        for(let socket_id in players){
            if(players[socket_id].room_id==room_id){
                socket.emit('room-aldready-exists',room_id)
                //console.log(`${room_id} was taken`)
                return;

            }
        }
        socket.join(room_id)
        player_count = Object.keys(players).length
        players[socket.id] = {playerNum : player_count + 1, room_id: room_id}
        console.log(players)
        socket.emit('create-room',room_id)
    })

    socket.on('cell_clicked',index=>{
        //selecting opponent,socket.id == id of opponent who just clicked
        client_room_id = players[socket.id].room_id
        for(let id in players){
            if(players[id].room_id == client_room_id && id!==socket.id){
                //updating opponent client's CLIENT BOARD
                io.to(id).emit('opponent_clicked_cell',index)
            }
        }
        
        
         

    })


    socket.on('disconnect',(socket)=>{
        delete players[socket.id]
    })
})
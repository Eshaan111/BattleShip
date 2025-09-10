const socketio = io('http://localhost:4000')

const row = 15;
const col = 15;

client_cells = document.getElementsByClassName('cell')

// adding cells to html and cell logic   
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
        if(classes.includes('cell-matchmaking-board')){
          var index = this.dataset.index
          console.log(client_cells[index])
          this.classList.add('clicked_cell')

        }
      }
    }
  }

}

build_board('matchmaking-board')
console.log(document.getElementById('matchmaking-board'))


const join_button = document.getElementById('join-room')
const create_button = document.getElementById('create-room')
const input_box = document.getElementById('room-id')
const warning_bar = document.getElementById('warning_bar')

function join_room(){
    warning_bar.style.display ='none';
    const room_id = input_box.value;
    if(room_id==''){
        warning_bar.innerText = 'Please Enter Valid ID!'
        warning_bar.style.display ='block';
        return
    }
    console.log(room_id)
    input_box.value = '';    
    
    //////JOIN ROOM REQUEST////////
    socketio.emit('join-room-req',room_id)
    socketio.on('room-doesnt-exist',room_id=>{
      warning_bar.innerText = 'Room Does Not Exist'
      warning_bar.style.display = 'block';
      return
    })
    socketio.on('full-room',room_id=>{
      warning_bar.innerText = 'FULL ROOM, cant join'
      warning_bar.style.display = 'block';
    })
        //confiramtion
    socketio.on('change-to-game',room_id=>{
        window.location.href=`index.html?room=${room_id}` //then socket.emit('enter-room') in script.js
    })
    

    
    
}

function create_room(){
    warning_bar.style.display ='none';
    const room_id = input_box.value;
    if(room_id==''){
        warning_bar.innerText = 'Please Enter Valid ID!'
        warning_bar.style.display ='block';
        return
    }
    console.log(room_id)
    input_box.value = '';
    
    //////ROOM CREATION REQUEST//////
    socketio.emit('create-room-req',room_id)
    socketio.on('room-aldready-exists',room_id=>{
        warning_bar.innerText = 'Room Aldready Exists'
        warning_bar.style.display ='block';
        console.log(`${room_id} was taken`)
        return
    })
            //Confirmation
    socketio.on('change-to-game',room_id=>{
        window.location.href=`index.html?room=${room_id}` //then socket.emit('create-room') in script.js
    })
    
    
}


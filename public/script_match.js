// const socketio = io('http://localhost:4000')

const socketio = io()

const row = 15;
const col = 15;

client_cells = document.getElementsByClassName('cell')
const join_enter_button = document.getElementById('join_btn')
const create_enter_button = document.getElementById('create_btn')
const id_input_box = document.getElementById('room-id')
const name_input_box = document.getElementById('name_input')
const message_bar = document.getElementById('message_bar')
const message_para = document.getElementById('message')



// adding cells to html and cell logic   
function build_board(board_name) {
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < col; j++) {
            const cell = document.createElement('div')
            var parent = document.getElementById(board_name)
            cell.classList.add('cell')
            cell.classList.add(`cell-${board_name}`)
            cell.dataset.index = 15 * i + j
            parent.appendChild(cell)

            cell.onclick = function () {
                var classes = Array.from(this.classList)
                if (classes.includes('cell-matchmaking-board')) {
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


function create_ask_name() {
    message_para.innerText = ''
    join_enter_button.style.display = 'none'
    message_bar.style.background = "rgba(0,0,0,0)"
    create_enter_button.style.display = 'block'
    name_input_box.style.display = 'block'
    message_bar.style.display = 'flex'

}

function join_ask_name() {

    message_para.innerText = ''
    create_enter_button.style.display = 'none'
    join_enter_button.style.display = 'block'
    name_input_box.style.display = 'block'
    message_bar.style.background = "rgba(0,0,0,0)"
    message_bar.style.display = 'flex'
}



// CREATE Room Button 
function enter_room_create() {
    message_bar.style.display = 'none';
    var room_id = id_input_box.value;
    if (room_id == '') {
        create_enter_button.style.display = 'none'
        join_enter_button.style.display = 'none'
        name_input_box.style.display = 'none'
        message_bar.style.background = "#f44336"
        message_para.innerText = 'Please Enter Valid ID!'
        message_bar.style.display = 'flex';
        return
    }
    console.log(room_id)
    id_input_box.value = '';

    //////ROOM CREATION REQUEST//////
    socketio.emit('create-room-req', room_id)
    socketio.on('room-aldready-exists', room_id => {
        create_enter_button.style.display = 'none'
        join_enter_button.style.display = 'none'
        name_input_box.style.display = 'none'
        message_bar.style.background = "#f44336"
        message_para.innerText = `Room <${room_id}> Aldready Exists`
        message_bar.style.display = 'flex';
        console.log(`${room_id} was taken`)
        return
    })
    //Confirmation
    socketio.on('change-to-game', data => {
        // data = [room_id,opponent_exists,opponent_name]
        var room_id = data[0]
        window.location.href = `${window.location.origin}/index.html?room=${room_id}&name=${name_input_box.value}&opponentName=invalid` //then socket.emit('create-room') in script.js
    })


}

// JOIN Room Button
function enter_room_join() {
    message_bar.style.display = 'none';
    var room_id = id_input_box.value;
    if (room_id == '') {
        create_enter_button.style.display = 'none'
        join_enter_button.style.display = 'none'
        name_input_box.style.display = 'none'
        message_bar.style.background = "#f44336"
        message_para.innerText = 'Please Enter Valid ID!'
        message_bar.style.display = 'flex';
        return
    }
    console.log(room_id)
    id_input_box.value = '';

    //////JOIN ROOM REQUEST////////
    console.log('reached here')
    socketio.emit('join-room-req', [room_id, name_input_box.value])
    socketio.on('room-doesnt-exist', room_id => {
        create_enter_button.style.display = 'none'
        join_enter_button.style.display = 'none'
        name_input_box.style.display = 'none'
        message_bar.style.background = "#f44336"
        message_para.innerText = `Room <${room_id}> doesnt exist`
        message_bar.style.display = 'flex';
        return
    })
    socketio.on('full-room', room_id => {
        create_enter_button.style.display = 'none'
        join_enter_button.style.display = 'none'
        name_input_box.style.display = 'none'
        message_bar.style.background = "#f44336"
        message_para.innerText = `Room <${room_id}> Full, Cant Join`
        message_bar.style.display = 'flex';
    })
    //confiramtion
    socketio.on('change-to-game', data => {
        //data = [room_id,opponent_exists(0/1),opponent_name]
        room_id = data[0]
        console.log('reaching')
        console.log(room_id)
        console.log(name_input_box.value)
        console.log(data[2])
        window.location.href = `${window.location.origin}/index.html?room=${room_id}&name=${name_input_box.value}&opponentName=${data[2]}` //then socket.emit('enter-room') in script.js
    })




}


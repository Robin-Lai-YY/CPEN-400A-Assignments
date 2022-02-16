var profile = {username: "Alice"};
var Service = {
    origin: window.location.origin,
    getAllRooms: function(){
        var that = this;
        return new Promise((resolve, reject) =>{
            var xhr = new XMLHttpRequest();
            xhr.open("GET", that.origin + "/chat", false);
            xhr.onload = function(){
                if(xhr.status == 200){
                    //console.log(xhr.responseText);
                    var copy = JSON.parse(xhr.responseText);
                    resolve(copy);
                }
                else if(xhr.status >= 400 && xhr.status < 500){
                    reject();
                }
                else if(xhr.status >= 500){
                    reject(new Error(xhr.responseText));                        
                }
            }
            xhr.send();
        })     
    },
    addRoom: function(data){
        var that = this;
        return new Promise((resolve, reject) =>{
            var xhr = new XMLHttpRequest();
            xhr.open("POST", that.origin + "/chat", false);
            xhr.onload = function(){
                if(xhr.status == 200){
                    //console.log(xhr.responseText);
                    var copy = JSON.parse(xhr.responseText);
                    resolve(copy);
                }
                else if(xhr.status >= 400 && xhr.status < 500){
                    reject();
                }
                else if(xhr.status >= 500){
                    reject(new Error(xhr.responseText));                        
                }
            }
            xhr.setRequestHeader("Content-type", "application/json");
            var data_in_json = JSON.stringify(data);
            xhr.send(data_in_json);
        })     
    },
    getLastConversation : function(roomId, before){
        var xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) =>{
            xhr.open("GET", Service.origin + "/chat" + "/" + roomId + "/messages?before=" + encodeURI(before), false);
            xhr.onload = ()=> {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    var result = JSON.parse(xhr.responseText);
                    resolve(result);
                }   
                else if (xhr.status >= 400 && xhr.status < 500) reject();
                else if (xhr.status >= 500) reject(Error(xhr.responseText));
            };
            xhr.send();
        });
    },
    getProfile : function() {
        var xhr = new XMLHttpRequest();
        return new Promise((resolve, reject) =>{
            xhr.open("GET", Service.origin + '/profile', false);
            xhr.onload = ()=> {
                if (xhr.readyState == 4 && xhr.status == 200) {
                        var result = JSON.parse(xhr.responseText);
                        resolve(result);
                }
                else if (xhr.status >= 400 && xhr.status < 500) {
                    reject();
                }
                else if (xhr.status >= 500) {
                    reject(new Error(xhr.responseText));
                } 
            };
            xhr.send();
        });
    }
};

function* makeConversationLoader(room) {
    var before = room.createdTimeStamp;
    var yield_var = null; 
    while (before > 0 && room.canLoadConversation) {
        room.canLoadConversation = false;
        Service.getLastConversation(room.id, before).then((result) => {
            if (result === null || result === undefined) {
                yield_var = null;
            } 
            else { 
                room.canLoadConversation = true;
                before = result.timestamp;
                room.addConversation(result);
                yield_var = result;
            }
        })
        yield yield_var;
    }
}



function emptyDOM (elem){
	while (elem.firstChild) elem.removeChild(elem.firstChild);
}

function createDOM (htmlString){
	let template = document.createElement('template');
	template.innerHTML = htmlString.trim();
	return template.content.firstChild;
}


class LobbyView{
    constructor(lobby){
        this.lobby = lobby;
        this.elem = createDOM(
            `<div id="page-view">
            <div class="content">
              <ul class="room-list">
                <li>
                  <img src="assets/everyone-icon.png" width="40px", height="40px">
                  <a href="#/chat" >Everyone in CPEN400A</a>
                </li>
            
                <li>
                  <img src="assets/bibimbap.jpg" width="40px", height="40px">
                  <a href="#/chat">Foodies only</a>
                </li>
            
                <li>
                  <img src="assets/minecraft.jpg" width="40px", height="40px">
                  <a href="#/chat">Gamers unite</a>
                </li>
            
                <li>
                  <img src="assets/canucks.png" width="40px", height="40px">
                  <a href="#/chat">Canucks</a>
                </li>
              </ul>
              
              <div class="page-control">
                <input type="text" placeholder="Room Title">
                
                <button>Creat Room</button>
            
              </div>
            </div>
            </div>
            `
            );
        this.listElem = this.elem.querySelector("ul.room-list");       
        this.inputElem = this.elem.querySelector("input");
        this.buttonElem = this.elem.querySelector("button");
        this.redrawList();
        var self = this;
        this.buttonElem.addEventListener("click", function() {
            var room_data = {
                name: self.inputElem.value,
                image: "assets/everyone-icon.png"
            }
            Service.addRoom(room_data).then(
                (result) =>{
                    self.lobby.addRoom(result._id, result.name, result.image, result.messages);
                    self.inputElem.value = '';    
                },
                (err) =>{
                    console.log(err);
                } 
            )
        });
        this.lobby.onNewRoom = function(room){
            self.redrawList();
        }
    }
    redrawList(){
        emptyDOM(this.listElem);
        Object.keys(this.lobby.rooms).forEach(element => {
            this.listElem.appendChild(createDOM(
            `<li>
            <img src="${this.lobby.rooms[element].image}" width="40px", height="40px">
            <a href="#/chat/${element}" >Everyone in CPEN400A</a>
            </li>
            `
          ));
        });
    }
    
}

class ChatView{
    constructor(socket){
        this.elem = createDOM(
            `<div id="page-view">
            <div class="content">
                <h4 class="room-name">Everyone in CPEN400A</h4>
                <div class="message-list">
                    <div class="message">
                        <span class="message-user">Alice</span>
                        <span class="message-text">Hi guys!</span>
                    </div>
                    <div class="message my-message">
                        <span class="message-user">Bob</span>
                        <span class="message-text">How is everyone doing today?</span>
                    </div>
                </div>
                <div class="page-control">
                    <textarea name="" id="" cols="30" rows="10"></textarea>
                    <button>Send</button>
                </div>
            
            </div>
            </div>
            `
            );
        this.titleElem = this.elem.querySelector("h4.room-name");
        this.chatElem = this.elem.querySelector("div.message-list");
        this.inputElem = this.elem.querySelector("textarea");
        this.buttonElem = this.elem.querySelector("button");
        this.room = null;
        this.socket = socket;
        var self = this;
        self.buttonElem.addEventListener("click", function(){self.sendMessage()});    
        this.inputElem.addEventListener("keyup", event => {if (event.key == 'Enter' && !event.shiftKey) {
            self.sendMessage();
        }
        });

        this.chatElem.addEventListener('wheel', function(e) {
            if (self.chatElem.scrollTop == 0 && e.deltaY < 0 && self.room.canLoadConversation) {
                self.room.getLastConversation.next();
            }
        });
    
   }
   sendMessage(){
       let text = this.inputElem.value;
       this.room.addMessage(profile.username, text);
       var message = {
        roomId: this.room.id,
        username: profile.username,
        text: this.inputElem.value
        }
        this.socket.send(JSON.stringify(message));
        this.inputElem.value = '';  
    }
   setRoom(room){
        this.room = room;
        this.titleElem.innerText = room.name;
        emptyDOM(this.chatElem);
        this.room.messages.forEach(element => {
           if(element.username == profile.username){
            this.chatElem.appendChild(createDOM(
                `
                <div class="message my-message">
                        <span class="message-user">${element.username}</span>
                        <span class="message-text">${element.text}</span>
                </div>
                `
            ));
           }
           else{
            this.chatElem.appendChild(createDOM(
                `
                <div class="message">
                        <span class="message-user">${element.username}</span>
                        <span class="message-text">${element.text}</span>
                </div>
                `
            ));
           }
        });
        var self = this;
        this.room.onNewMessage = function(message) {
            let text = message.text;
            if(text.includes("<img") || text.includes("<button") || text.includes("</button") || text.includes("<div")){
                message.text = " ";                
            }
            if(message.username == profile.username){
                self.chatElem.appendChild(createDOM(
                    `
                    <div class="message my-message">
                            <span class="message-user">${message.username}</span>
                            <span class="message-text">${message.text}</span>
                    </div>
                    `
                ));
               }
               else{
                self.chatElem.appendChild(createDOM(
                    `
                    <div class="message">
                            <span class="message-user">${message.username}</span>
                            <span class="message-text">${message.text}</span>
                    </div>
                    `
                ));
               }
        }
        this.room.onFetchConversation = function(conversation){
            var message = conversation.messages.reverse();
            var height = self.chatElem.scrollHeight;
            var height1 = self.chatElem.scrollHeight;
            message.forEach(element => {
                if(element.username == profile.username){
                 self.chatElem.prepend(createDOM(
                     `
                     <div class="message my-message">
                             <span class="message-user">${element.username}</span>
                             <span class="message-text">${element.text}</span>
                     </div>
                     `
                 ));
                }
                else{
                 self.chatElem.prepend(createDOM(
                     `
                     <div class="message">
                             <span class="message-user">${element.username}</span>
                             <span class="message-text">${element.text}</span>
                     </div>
                     `
                 ));
                }
                height1 += 50;
            });
            self.chatElem.scrollTop = height1 - height;
            conversation.messages.reverse();
        }

   }
   
}

class ProfileView{
    constructor(){
        this.elem = createDOM(
            `<div id="page-view">
            <div class="content">
                <div class="profile-form">
                    <div class="form-field">
                        <label for="">Username</label>
                        <input type="text" name="" id="">
                    </div>

                    <div class="form-field">
                        <label for="">Password</label>
                        <input type="password" name="" id="">
                    </div>

                    <div class="form-field">
                        <label for="">Avatar Image</label>
                        <img src="assets/profile-icon.png" width="30px", height="30px">
                        <input type="file" name="" id="">
                    </div>
                    <div class="form-field">
                        <label for="">About</label>
                        <input type="text" name="" id="">
                    </div>
                </div>
                <div class="page-control">
                    <button>Save</button>
                </div>
            </div>
            </div>
            `
            );
    }
}
class Room{
    constructor(id, name, image = "assets/everyone-icon.png", messages = []){
        this.image = image;
        this.messages = messages;
        this.id = id;
        this.name = name;
        this.createdTimeStamp = Date.now();
        this.getLastConversation = makeConversationLoader(this);
        this.canLoadConversation = true;
    }
    addMessage(username, text){
        
        if(text.trim().length == 0) return;
        else{ 
            let message = {username: username, text: text}
            if(text.includes("<img") || text.includes("<button") || text.includes("</button") || text.includes("<div")){
                message.text = " ";                
            }
            this.messages.push(message);
            if(typeof this.onNewMessage === typeof Function){
                this.onNewMessage(message);
            }
        }
    }
    addConversation(conversation) {
        var conversation_msgs = conversation.messages;
        var concat = conversation_msgs.concat(this.messages);
        this.messages = concat;
        this.onFetchConversation(conversation);
    }
}

class Lobby{
    constructor(){
        this.rooms = {};
    }
    getRoom(roomId){
        return this.rooms[roomId];
    }
    addRoom(id, name, image, messages){
        const new_room = new Room(id, name, image, messages);
        const new_room_id = new_room.id;
        this.rooms[new_room_id] = new_room;
        if(typeof this.onNewRoom  === typeof Function ){
            this.onNewRoom(new_room);
        }
    }

}

function main() {
    let socket = new WebSocket("ws://localhost:8000");
    socket.addEventListener("message", function(event){
        var message_data = JSON.parse(event.data);
        lobby.getRoom(message_data.roomId).addMessage(message_data.username, message_data.text);
    });

    let lobby = new Lobby();
    let lobbyView = new LobbyView(lobby);
    let chatView = new ChatView(socket);
    let profileView = new ProfileView();
    
    Service.getProfile().then( (result) => { 
        profile.username = result.username;
    });
    
    
    function renderRoute() {
        if(window.location.hash == "#/"){
            emptyDOM(document.getElementById("page-view"));
            document.getElementById("page-view").appendChild(lobbyView.elem)
        }
        else if(window.location.hash.includes("#/chat", 0)){
            let room = lobby.getRoom(window.location.hash.substring(7));
            if(room != null){
                chatView.setRoom(room);
            }
            emptyDOM(document.getElementById("page-view"));
            document.getElementById("page-view").appendChild(chatView.elem);
            
        }
        else if(window.location.hash == "#/profile"){
            emptyDOM(document.getElementById("page-view"));
            document.getElementById("page-view").appendChild(profileView.elem);
        }

    }
    setInterval(refreshLobby, 10000);
    function refreshLobby(){
        Service.getAllRooms().then(
            (result) => {
                result.forEach(element => {
                    if(typeof(lobby.rooms[element._id]) === typeof(new Room)){
                        lobby.rooms[element._id].name = element.name;
                        lobby.rooms[element._id].image = element.image;
                    }
                    else{
                        lobby.addRoom(element._id, element.name, element.image, element.messages);
                    }
                });
            });
        (error) =>{}
    }
    refreshLobby();

    window.addEventListener('popstate', renderRoute);
    renderRoute();

    // cpen400a.export(arguments.callee, { renderRoute });
    cpen400a.export(arguments.callee, { renderRoute, lobby, lobbyView, chatView, profileView, refreshLobby, socket});
    // cpen400a.export(arguments.callee, { renderRoute, lobbyView });
    // cpen400a.export(arguments.callee, { renderRoute, chatView });
    // cpen400a.export(arguments.callee, { renderRoute, profileView});
 
}
window.addEventListener('load', main);
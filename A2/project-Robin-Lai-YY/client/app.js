var profile = {username: "Alice"};
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
            let name = self.inputElem.value;
            self.lobby.addRoom(Object.keys(lobby.rooms).length + 1, name, "assets/everyone-icon.png", []);
            self.inputElem.value = '';    
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
    constructor(){
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
        var self = this;
        self.buttonElem.addEventListener("click", function(){self.sendMessage()});    
        this.inputElem.addEventListener("keyup", event => {if (event.key == 'Enter' && !event.shiftKey) {
            self.sendMessage();
        }
        });
    
   }
   sendMessage(){
       let text = this.inputElem.value;
       this.room.addMessage(profile.username, text);
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
    }
    addMessage(username, text){
        
        if(text.trim().length == 0) return;
        else{
            let message = {username: username, text: text}
            this.messages.push(message);
            if(typeof this.onNewMessage === typeof Function){
                this.onNewMessage(message);
            }
        }
    }
}

class Lobby{
    constructor(){
        const room1 = new Room(1, "room1", "assets/everyone-icon.png");
        const room2 = new Room(2, "room2", "assets/bibimbap.jpg");
        const room3 = new Room(3, "room3", "assets/minecraft.jpg");
        const room4 = new Room(4, "room4", "assets/canucks.png");
        this.rooms = {1:room1, 2:room2, 3:room3, 4:room4};
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
    let lobby = new Lobby();
    let lobbyView = new LobbyView(lobby);
    let chatView = new ChatView();
    let profileView = new ProfileView();
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
    window.addEventListener('popstate', renderRoute);
    renderRoute();

    // cpen400a.export(arguments.callee, { renderRoute });
    cpen400a.export(arguments.callee, { renderRoute, lobby, lobbyView, chatView, profileView});
    // cpen400a.export(arguments.callee, { renderRoute, lobbyView });
    // cpen400a.export(arguments.callee, { renderRoute, chatView });
    // cpen400a.export(arguments.callee, { renderRoute, profileView});
 
}
window.addEventListener('load', main);
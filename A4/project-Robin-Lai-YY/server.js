const cpen400a = require('./cpen400a-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const wss = require('ws');

var mongoUrl = "mongodb://localhost:27017";
var dbName = "cpen400a-messenger";
var Database = require("./Database.js");
const { throws } = require('assert');
var db = new Database(mongoUrl, dbName);

const messageBlockSize = 10;

var chatrooms = [
	{	id: "0",
		name: "1",
		image: "2"
	},
	{	id: "1",
		name: "1",
		image: "2"
	}
];

var messages = {};

db.getRooms().then((room) =>{
	room.forEach(element => {
		messages[element._id] = [];
	});
})	



function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

app.route('/chat')
	.get(function (req, res, next) {
		var return_arr = [];
		db.getRooms().then((result) =>{
			result.forEach(element => {
				return_arr.push({
					"_id": element._id,
					"name": element.name,
					"image": element.image,
					"messages": messages[element._id]
				});
			});
			res.status(200).json(return_arr);
		})
	})
	.post(function (req, res, next) {
		//console.log(req.body)
		db.addRoom(req.body).then((result) => {
			db.getRooms().then((room) =>{
				room.forEach(element => {
					messages[element._id] = [];
				});
			})	
		res.status(200).json(result);
		},
		(reject) => {
			res.status(400).send(reject); 
		});
	});

app.route('/chat/:room_id')
	.get(function (req, res) {
		db.getRoom(req.params.room_id).then( (result) =>{
			if(result !== null) {
				res.status(200).json(result);
			}	
			else {
				//console.log("ERROR!");
				res.status(404).json("Room X was not found");
			}
		})
	});

app.route('/chat/:room_id/messages')
	.get(function(req, res, next) {
		var roomId = req.params.room_id
		var before = parseInt(req.query.before);
		db.getLastConversation(roomId, before).then((conversation) => {
			if (conversation != null) res.status(200).json(conversation);
			else res.status(404).json("not found");
		})
	})
	
	var broker = new wss.Server({ port: 8000 });

	broker.on('connection', function connection(ws) {
  		ws.on('message', function incoming(message) {
    		broker.clients.forEach(element => {
				if (element !== ws && element.readyState === wss.OPEN) {
					element.send(message);
				}
			});
			var message_in_json = JSON.parse(message);
		  	messages[message_in_json.roomId].push(message_in_json);
			
			if (messages[message_in_json.roomId].length >= messageBlockSize) {
				var conversation = {room_id:message_in_json.roomId, timestamp:Date.now(), messages:messages[message_in_json.roomId]};
				db.addConversation(conversation).then(()=> {
					messages[message_in_json.roomId] = [];
				});
			}
		});
	});

cpen400a.connect('http://35.183.65.155/cpen400a/test-a4-server.js');
cpen400a.export(__filename, { app });
cpen400a.export(__filename, { db });
// cpen400a.export(__filename, { messageBlockSize });
cpen400a.export(__filename,	{chatrooms});
cpen400a.export(__filename, { messages });
cpen400a.export(__filename, { messageBlockSize });
cpen400a.export(__filename, { broker});
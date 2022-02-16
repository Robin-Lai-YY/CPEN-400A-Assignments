const cpen400a = require('./cpen400a-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const wss = require('ws');

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

var messages = {
	"0": [],
	"1": []
}

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
		var room = [];
		chatrooms.forEach(element => {
			room.push({
					id: element.id, 
					name: element.name, 
					image: element.image, 
					messages: messages[element.id]
				});
		});
		//console.log(room);
		res.status(200).json(room);
	})
	.post(function (req, res, next) {
		if(typeof(req.body.name) != "string"){
			res.status(400).json("Name does not exists!")
		}
		else{
			var room = {
				id: "2",
				name: req.body.name,
				image: req.body.image
			};
			chatrooms.push(room);
			messages["2"] = [];
			var new_room = {
				id: "2",
				name: req.body.name,
				image: req.body.image,
				messages: []
			}
			res.status(200).json(new_room);
		}
	});

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
  		});
	});

cpen400a.connect('http://35.183.65.155/cpen400a/test-a3-server.js');
cpen400a.export(__filename, { app });
cpen400a.export(__filename,	{chatrooms});
cpen400a.export(__filename, { messages});
cpen400a.export(__filename, { broker});
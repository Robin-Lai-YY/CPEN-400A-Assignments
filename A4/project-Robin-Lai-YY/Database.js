const { MongoClient, ObjectID } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v3.6+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.6/api/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen400a app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{ useUnifiedTopology: true },
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRooms = function(){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatrooms from `db`
			 * and resolve an array of chatrooms */
			db.collection("chatrooms").find({}).toArray(function(err, result) {
				if (err) throw err;
				else resolve(result);
			});
		})
	)
}

Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise(async (resolve, reject) => {
			/* TODO: read the chatroom from `db`
			 * and resolve the result */
			let id;

			try{id = ObjectID(room_id)}
			catch (error) {id = room_id;}
			
			const room = await db.collection("chatrooms").find({"_id": id }).toArray(function (err, result) {
				if(result[0] === undefined){
					// console.log("ERROR!");
					resolve(null);
				}		
				else{
					// console.log("SUCCESS!");
					// console.log(result[0]);
					resolve(result[0]);
				}
					
			});			
		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */
			if(room['name']===undefined){
				reject(room);
			}

			db.collection("chatrooms").insertOne(room, function(err,res){
				if(err) throw err;
				else 
					resolve(room);
			} );
		})
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise(async (resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
			var conversations = [];
			var timestamp = before;
			if (before == null) timestamp = Date.now();
			const res = await db.collection("conversations").find({}).toArray(function(err, result){
				result.forEach(conversation => {
					if (typeof room_id == "object") {
						if (conversation.timestamp < timestamp && conversation.room_id == room_id.room_id) 
							conversations.push(conversation);
					} 
					else if (conversation.timestamp < timestamp && conversation.room_id == room_id) 
						conversations.push(conversation);
				});			
				if (conversations.length !== 0){
					var closest = timestamp;
					var index = 0;
					for (var i = 0; i < conversations.length; i++) {
						if (timestamp - conversations[i].timestamp < closest) {
							closest = timestamp - conversations[i].timestamp;
							index = i;
						}
					}
					resolve(conversations[index]);
				} 
				else {
					resolve(null);	
				}
			});
			
		})
	)
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
			if (conversation.room_id == null || conversation.timestamp == null 
				|| conversation.messages == null) reject(Error("missing fields"));
			else {
				db.collection("conversations").insertOne(conversation, function(err, res) {
					if (err) throw err;
					else resolve(res.ops[0]);
				});
			}
		})
	)
}

module.exports = Database;
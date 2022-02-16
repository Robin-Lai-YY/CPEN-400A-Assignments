const { strict } = require('assert');
const { DH_UNABLE_TO_CHECK_GENERATOR } = require('constants');
const crypto = require('crypto');

class SessionError extends Error {};

function SessionManager (){
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	// keeping the session data inside a closure to keep them protected
	const sessions = {};

	// might be worth thinking about why we create these functions
	// as anonymous functions (per each instance) and not as prototype methods
	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
        /* To be implemented */
        var random = crypto.randomBytes(256).toString('hex');
		var object = {"username": username};
		sessions[random] = object;
		
		response.cookie('cpen400a-session', random, { maxAge: maxAge});
		setTimeout(delete_func, maxAge);
		function delete_func() {
			delete sessions[random];
		}

	};

	this.deleteSession = (request) => {
		/* To be implemented */
		let cookie = request.session;
		delete request.username;	
		if(cookie !== null){
			delete sessions[cookie];
		}
		delete request.session;		
	};

	this.middleware = (request, response, next) => {
		/* To be implemented */
		var cookie = request.headers.cookie;
		// console.log("cookie: "+ cookie);
		// console.log(request.headers);
		if(cookie == null){
			next(new SessionError('no cookie'));
		}
		else{
			cookie = cookie.split(';').map(s => s.split('=').pop().trim()).shift();
			// cookie = cookie.split('=')[1];
			
			if(sessions[cookie] == null){
				next(new SessionError('no cookie'));
			}
			else{
				request.username = sessions[cookie].username;
				request.session = cookie;				
				next();
			}
		}		
	};

	this.middleware_errorHandler = (err, req, res, next) =>{
		if(err instanceof SessionManager.Error){
			let format = req.headers.accept;
			if(format == 'application/json') res.status(401).json(err);
			else res.redirect('/login');
		}
		else{
			res.status(500).send();
		}
	};


	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;
//	App Customization

var appPort = 4000;

// Librairies

var express = require('express'), app = express();
var http = require('http'),
			server = http.createServer(app),
			io = require('socket.io').listen(server);
// var io = require('socket.io').listen(app);
var pseudoArray = ['admin']; // block following usernames

// Views Options

app.set('views',__dirname + '/views');
app.engine('html',require('ejs').renderFile);
app.set('view engine','html'); // jade changed to html
app.set("view options",{ layout: false })
app.configure(function(){
	app.use(express.static(__dirname + '/public'));
});

// Rendering the Main Page

app.get('/',function(req, res){
	res.render('home.html');
});
server.listen(appPort);
console.log("Server listening on port 4000");

// Handing users

var users = 0; // Maintain count of the users

// Handling socket connections
io.sockets.on('connection',function(socket){ // First connection

	users += 1;
	reloadUsers();

	// Broadcast the message to all
	socket.on('message',function(data){
		if(pseudoSet(socket)){
			var transmit = {date : new Date().toISOString(), pseudo : returnPseudo(socket), message : data};
			socket.broadcast.emit('message', transmit);
			console.log("user "+ transmit['pseudo'] +" said \""+data+"\"");
		}
	});

	// Assign username
	socket.on('setPseudo',function(data){
		if (pseudoArray.indexOf(data) == -1){ // Check if username is already taken
			socket.set('pseudo',data,function(){
				pseudoArray.push(data);
				socket.emit('pseudoStatus','ok');
				console.log("user " + data + " connected");
			});
		}
		else{
			socket.emit('pseudoStatus','error') // Send Error : 'Username Already Exists'
		}
	});

	// Disconnect a client
	socket.on('disconnect',function(){
		users -= 1;
		reloadUsers();
		if (pseudoSet(socket)){
			var pseudo;
			socket.get('pseudo',function(err,name){
				pseudo = name;
			});
			var index = pseudoArray.indexOf(pseudo);
			pseudo.slice(index - 1, 1);
		}
	});
});

// Broadcast the count of users
function reloadUsers(){
	io.sockets.emit('nbUsers',{"nb": users});
}

// Test if the user has a name
function pseudoSet(socket){
	var test;
	socket.get('pseudo',function(err, name){
		if(name==null)
			test = false;
		else
			test = true;
	});
	return test;
}

// Get name of the user
function returnPseudo(socket){
	var pseudo;
	socket.get('pseudo',function(err, name) {
		if(name==null)
			pseudo = false;
		else
			pseudo = name;
	});
	return pseudo;
}

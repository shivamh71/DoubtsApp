//	Server Configurations
var appPort = 4000;
var logFileName = "data.txt";

// Librairies
var fs = require('fs');
var express = require('express'), app = express();
var http = require('http'), server = http.createServer(app);
var io = require('socket.io').listen(server);
var pseudoArray = ['admin']; // block following usernames

// Views Options
app.set('views',__dirname + '/views');
app.engine('html',require('ejs').renderFile);
app.set('view engine','html');
app.set("view options",{ layout: false })
app.configure(function(){
	app.use(express.static(__dirname + '/public'));
});

// Rendering the Main Page
app.get('/',function(req, res){
	res.render('home.html');
});

// Server startup
server.listen(appPort);
console.log("Server listening on port "+ appPort);

// Global Variables
var totalDoubts = 0; // Maintain count of the doubts
var doubtsArray = [];
var upvoteArray = [];
var users = 0; // Maintain count of the users

// Data Doubt Class
function Doubt(user,content,timeStamp) {
	this.id = totalDoubts;
	this.user = user;
    this.content = content;
    this.timeStamp = timeStamp;
    this.count = 0;
}

// Handling socket connections
io.sockets.on('connection',function(socket){ // First connection

	users += 1;
	reloadUsers();

	// Upvote listener
	socket.on('upvote',function(data){
		var str = returnPseudo(socket)+data;
		if(upvoteArray.indexOf(str) == -1){
			upvoteArray.push(str);
			for (var i=0; i < doubtsArray.length; i++) {
				var doubt = doubtsArray[i];
				if(doubt.id == parseInt(data)){
					doubtsArray[i].count += 1;
					io.sockets.emit('updateVote',{doubtId : data , count : doubtsArray[i].count });
					break;
				}
			}
		}else{
			delete upvoteArray[upvoteArray.indexOf(str)];
			for (var i=0; i < doubtsArray.length; i++) {
				var doubt = doubtsArray[i];
				if(doubt.id == parseInt(data)){
					doubtsArray[i].count -= 1;
					io.sockets.emit('updateVote',{doubtId : data , count : doubtsArray[i].count });
					break;
				}
			}
		}
	});

	// Delete message listener
	socket.on('deleteMessage',function(data){
		io.sockets.emit('deleteMessageFromServer',{"doubtId": data});
		for (var i=0; i < doubtsArray.length; i++) {
			var doubt = doubtsArray[i];
			if(doubt.id == parseInt(data)){
				doubtsArray.splice(i,1);
				break;
			}
		}
	});

	// Broadcast the message to all
	socket.on('message',function(data){
		if(pseudoSet(socket)){
			var userId = returnPseudo(socket);
			socket.emit('setDoubtId',totalDoubts);
			var date = new Date();
			date = date.toLocaleTimeString();
			console.log(date);
			var doubt  = new Doubt(userId,data,date);
			doubtsArray.push(doubt);
			var transmit = {doubtId:doubt.id, upvotes:doubt.count, date:date, pseudo:userId, message:data};
			socket.broadcast.emit('message', transmit);
			totalDoubts += 1;
			fs.appendFile(logFileName,JSON.stringify(doubt)+'\n',function(err){}); // Dump to FILE
		}
	});

	// Assign username
	socket.on('setPseudo',function(data){
		console.log("-------------------------------------------------------------::   "+data);
		if(data[data.length-1]=='!'){
			console.log("---------------Refreshed--------------");			
			data = data.slice(0,-1);
			socket.set('pseudo',data,function(){
				socket.emit('pseudoStatus','ok');
			});
			for (var i=0; i < doubtsArray.length; i++) {				
				var doubt = doubtsArray[i];
				var transmit = {doubtId: doubt.id , upvotes : doubt.count , date : doubt.timeStamp , pseudo : doubt.user, message : doubt.content};
				socket.emit('message', transmit);
			}
		}else if (pseudoArray.indexOf(data) == -1){ // Check if username is already taken
			console.log("---------------New User--------------");
			socket.set('pseudo',data,function(){
				pseudoArray.push(data);
				socket.emit('pseudoStatus','ok');
			});
			//Print all previous doubts to the newly connected User
			for (var i=0; i < doubtsArray.length; i++) {
				var doubt = doubtsArray[i];
				var transmit = {doubtId: doubt.id , upvotes : doubt.count , date : doubt.timeStamp , pseudo : doubt.user, message : doubt.content};
				socket.emit('message', transmit);
			}
		}else{
			console.log("---------------Error--------------");
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

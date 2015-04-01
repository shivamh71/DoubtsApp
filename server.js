/*
	Server Configurations
		appPort : Port on which server application will listen
*/
var appPort = 4000;
/*
	Librairies Used
		fs : For file handling
		express : NodeJS framework used to create the application
		http : For rendering html pages
		socket.io : For handling client connections
*/
var fs = require('fs');
var express = require('express'), app = express();
var http = require('http'), server = http.createServer(app);
var io = require('socket.io').listen(server);
/*
	Views Options
		All HTML pages to be sent to the client are placed in "views"
			directory
		All other files scripts, stylesheets, images to be placed in
			"public" directory
*/
app.set('views',__dirname + '/views');
app.engine('html',require('ejs').renderFile);
app.set('view engine','html');
app.set("view options",{layout:false})
app.configure(function(){
	app.use(express.static(__dirname + '/public'));
});
/*
	Function to render the main page i.e. "home.html"
*/
app.get('/',function(req,res){
	res.render('home.html');
});
/*
	Server startup code
*/
server.listen(appPort);
console.log("Server listening on port " + appPort);
/*
	Global Variables
		logFileName : Name of dump file created at end of session
		totalDoubts : Total number of doubts currently present
		doubtsArray : Array of all doubt objects
		upvoteArray : Array to keep track of all user upvotes
		users : Number of connected users
		pseudoArray : Array of taken usernames
*/
var logFileName = "data.txt";
var totalDoubts = 0;
var doubtsArray = [];
var upvoteArray = [];
var users = 0;
var pseudoArray = ['admin'];
/*
	Class for Doubt Object
		id : Unique Id for the object
		user : Username who submitted the doubt
		content : Textual part of doubt
		timeStamp : Time at which doubt submitted
		count : Number of upvotes received
*/
function Doubt(user,content,timeStamp){
	this.id = totalDoubts;
	this.user = user;
    this.content = content;
    this.timeStamp = timeStamp;
    this.count = 0;
}
/*
	Socket handler for new user
*/
io.sockets.on('connection',function(socket){ // First connection
/*
	Increment number of users on new connection and broadcast
		incremented count to all users
*/
	users += 1;
	reloadUsers();
/*
	Listener for user upvotes
		data : Id of doubt which is to be upvoted or downvoted
	Iterate upvote array to find if the concerned doubt has already
		been upvoted by this user. If not then add this information
		to "upvoteArray" and broadcast to all users to change upvote
		count of this doubt
	In case user had already upvoted this doubt then his upvote is
		removed by deleting it from "upvoteArray" and this info is
		broadcast to all users
*/
	socket.on('upvote',function(data){
		var str = returnPseudo(socket) + data;
		if(upvoteArray.indexOf(str)==-1){
			upvoteArray.push(str);
			for(var i=0;i<doubtsArray.length;i++){
				var doubt = doubtsArray[i];
				if(doubt.id==parseInt(data)){
					doubtsArray[i].count += 1;
					io.sockets.emit('updateVote',{doubtId:data, count:doubtsArray[i].count});
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
/*
	Listener for delete messages
		data : Id of doubt to be deleted
	A user is allowed to delete only his own doubts. Doubt
		is removed from "doubtsArray" and this message is broadcast
		to all users
*/
	socket.on('deleteMessage',function(data){
		io.sockets.emit('deleteMessageFromServer',{"doubtId":data});
		for (var i=0;i<doubtsArray.length;i++){
			var doubt = doubtsArray[i];
			if(doubt.id==parseInt(data)){
				doubtsArray.splice(i,1);
				break;
			}
		}
	});
/*
	Listener for new message
		data : Text content of the doubt
			New "Doubt" object is created and pushed to "doubtsArray"
			"totalDoubts" is incremented and broadcast message sent
			to all users
*/
	socket.on('message',function(data){
		if(pseudoSet(socket)){
			var userId = returnPseudo(socket);
			socket.emit('setDoubtId',totalDoubts);
			var date = new Date();
			date = date.toLocaleTimeString();
			var doubt  = new Doubt(userId,data,date);
			doubtsArray.push(doubt);
			var transmit = {doubtId:doubt.id, upvotes:doubt.count, date:date, pseudo:userId, message:data};
			socket.broadcast.emit('message', transmit);
			totalDoubts += 1;
			fs.appendFile(logFileName,JSON.stringify(doubt)+'\n',function(err){}); // Dump to FILE
		}
	});
/*
	Function to assign a username to the client
		data : Username submitted by the client
	If last character of the username is a '!' it means that the
		username is being picked up from a cookie. If the username
		already exists error message is shown otherwise the desired
		username is alloted and added to "pseudoArray". Once the
		username has been decided all messages in "doubtsArray"
		are transmitted to the new user
*/
	socket.on('setPseudo',function(data){
		if(data[data.length-1]=='!'){
			data = data.slice(0,-1);
			socket.set('pseudo',data,function(){
				socket.emit('pseudoStatus','ok');
			});
			for (var i=0; i < doubtsArray.length; i++) {
				var doubt = doubtsArray[i];
				var transmit = {doubtId: doubt.id , upvotes : doubt.count , date : doubt.timeStamp , pseudo : doubt.user, message : doubt.content};
				socket.emit('message', transmit);
			}
		}else if(pseudoArray.indexOf(data) == -1){
			socket.set('pseudo',data,function(){
				pseudoArray.push(data);
				socket.emit('pseudoStatus','ok');
			});
			for (var i=0; i < doubtsArray.length; i++) {
				var doubt = doubtsArray[i];
				var transmit = {doubtId: doubt.id , upvotes : doubt.count , date : doubt.timeStamp , pseudo : doubt.user, message : doubt.content};
				socket.emit('message', transmit);
			}
		}else socket.emit('pseudoStatus','error');
	});

/*
	Listener to disconnect a client
		Number of users is decremented. Corresponding username is
		freed from the list. Broadcast message sent to all users to
		reload number of connected users
*/
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
/*
	Function to broadcast the count of users to all clients
*/
function reloadUsers(){
	io.sockets.emit('nbUsers',{"nb": users});
}
/*
	Check is a username has been alloted to this client
*/
function pseudoSet(socket){
	var test;
	socket.get('pseudo',function(err, name){
		if(name==null) test = false;
		else test = true;
	});
	return test;
}
/*
	Function to get username of this client
*/
function returnPseudo(socket){
	var pseudo;
	socket.get('pseudo',function(err, name) {
		if(name==null) pseudo = false;
		else pseudo = name;
	});
	return pseudo;
}

//	App Customization

var appPort = 4000;

// Librairies

var fs = require('fs');

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
console.log("Server listening on port "+ appPort);

var totalDoubts = 0; // Maintain count of the doubts

// Data Doubt Class 
var doubtsArray = [];
function Doubt(user,content,timeStamp) {
	this.id = totalDoubts;
	this.user = user;
    this.content = content;
    this.timeStamp = timeStamp;
    this.count = 0;
}

//handlling Upvotes
var upvoteArray = [];

// Handing users

var users = 0; // Maintain count of the users

// Handling socket connections
io.sockets.on('connection',function(socket){ // First connection

	users += 1;
	reloadUsers();

	//upvote listener
	socket.on('upvote',function(data){
		// console.log(data + " yahooooooooo " + doubtsArray[parseInt(data)]);		
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
			date = date.toDateString()+" "+date.toLocaleTimeString();

			var doubt  = new Doubt(userId,data,date);
			doubtsArray.push(doubt);			

			var transmit = {doubtId:doubt.id , upvotes : doubt.count , date : date , pseudo : userId, message : data};
			socket.broadcast.emit('message', transmit);
			console.log("user "+ transmit['pseudo'] +" said \""+data+"\"");

			totalDoubts += 1;

			//Write to FILE
			fs.appendFile('data.txt', JSON.stringify(doubt)+ '\n' , function (err) {				
			});
					
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

			//Print all previous doubts to the newly connected User
			for (var i=0; i < doubtsArray.length; i++) { 
				var doubt = doubtsArray[i];
				var transmit = {doubtId: doubt.id , upvotes : doubt.count , date : doubt.timeStamp , pseudo : doubt.user, message : doubt.content};
				socket.emit('message', transmit);		
			}
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
	// io.sockets.emit('nbUsers',{"nb": users,"doubtsArray":doubtsArray});

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

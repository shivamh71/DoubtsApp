/*
	Client Configurations
		reloadTime : Time in miliseconds after which client screen
			refreshes
		numRandomDoubts : Number of randomly chosen doubts to be
			displayed to client after each refresh
		cookieExpiryTime : Expiry time in miliseconds to be used
			for the cookie
*/
var reloadTime = 5000000;
var numRandomDoubts = 5;
var cookieExpiryTime = 24*60*60*1000;
/*
	GLobal Variables
		pseudo : Username of this client
		messageContainer : binding variable to get text contained in
			new doubt from the HTML form
		submitButton : binding variable for submit button of new
			doubt HTML form
		sortState : Sorting criteria being used to sort doubts
			0 - Most Recent First
			1 - Most Recent Last
			2 - Most Upvoted First
			3 - Most Upvoted Last
			Default sort state is Most Recent First
*/
var pseudo = "", messageContainer, submitButton;
var sortState = 0;
/*
	Function to intialize new client connection
*/
$(function(){
/*
	Bind the global variables to their corresponding HTML elements
*/
	messageContainer = $('#messageInput');
	submitButton = $("#submit");
	bindButton();
/*
	On getting a new client connection request first cookie is
		checked to see if there exists a user session. If a session
		exists then username saved in the cookie is alloted to
		requesting client. If cookie doesn't exist a dialog box
		asking for a username is shown. Once username is decided
		it is saved in the cookie
*/
	if(getCookie('userName')==""){
		$("#alertPseudo").hide();
		BootstrapDialog.show({
			id: "mymy",
			title: 'Enter Username',
			message: $('<input id="pseudoInput" type="text" class="form-control" placeholder="Username" />'),
			buttons: [{
				label: 'Submit',
				cssClass: 'btn-primary',
				hotkey: 13,
				action: function(dialogItself){
					setPseudo(dialogItself);
				},
			}]
		});
	}else{
		socket.emit('setPseudo',getCookie("userName")+'!');
		pseudo = getCookie('userName');
	}
	$("#pseudoSubmit").click(function(){
		setPseudo();
	});
/*
	Both Sumbit button and Enter key on keybooard are binded to
		the function to send new doubt
*/
	submitButton.click(function(){
		sentMessage();
	});
	$('#messageInput').keypress(function(e){
		if(e.which==13)
			sentMessage();
	});
/*
	Function to select random doubts to be displayed to the client
		This function gets called after every "reloadTime"
		miliseconds. "numRandomDoubts" doubts are chosen randomly
		from "doubtList", pushed "randArray" and removed from
		"doubtList". Both randArray and doubtList are sorted as per
		the sort state. The new "doubtList" is then "randArray"
		concatenated with old "doubtList"
*/
	setInterval(function(){
		var doubtList = $('#chatEntries > div');
		if(doubtList.length > numRandomDoubts){
			var randArray = [];
			for(i=0;i<numRandomDoubts;i++){
				randNum = Math.floor((Math.random() * doubtList.length));
				randArray.push(doubtList[randNum]);
				doubtList.splice(randNum,1);
			}
			if(sortState == 0){
				randArray.sort(compareTime);
				doubtList.sort(compareTime);
			}
			else if(sortState == 1){
				randArray.sort(compareTime).reverse();
				doubtList.sort(compareTime).get().reverse();
			}
			else if(sortState == 2){
				randArray.sort(compareVote);
				doubtList.sort(compareVote);
			}
			else if(sortState == 3){
				randArray.sort(compareVote).reverse();
				doubtList.sort(compareVote).get().reverse();
			}else{
				console.log("Should not reach here !")
			}
			$('#chatEntries').empty();
			for(i=0;i<numRandomDoubts;i++){
				$('#chatEntries').append(randArray[i].outerHTML);
			}
			for(i=0;i<doubtList.length;i++){
				$('#chatEntries').append(doubtList[i].outerHTML);
			}
		}
	},reloadTime);
});
var socket = io.connect();
/*
	Listener for successfull connection status message from server
*/
socket.on('connect',function(){
	console.log('connected');
});
/*
	Listener for number of connected users message from server
		msg : New count of connected clients
*/
socket.on('nbUsers',function(msg){
	$("#nbUsers").html(msg.nb);
});
/*
	Listener for new doubt message from server
		data : JSON object containing new message information
*/
socket.on('message',function(data){
	addMessage(data.doubtId ,data.upvotes, data.message, data.pseudo, data.date, false);
});
/*
	Listener for upvote message from server
		data : JSON object containing Id and updated upvote count
			of the concerned doubt
*/
socket.on('updateVote',function(data){
	var id = data.doubtId;
	var count = data.count;
	$('#'+id+'> .text').html(count);
});
/*
	Listener for setDoubtId message from server
		data : Id allocated to the new doubt
	Once user enters a new doubt this doubt goes to server where it
		is allocated a unique Id which is then sent to all clients
*/
socket.on('setDoubtId',function(data){
	$("#Unknown").attr("onclick","deleteMessage("+data+")");
	$("#Unknown").attr("id",''+data);
});
/*
	Listener for delete doubt message from server
		data : JSON object containing Id of the doubt to be deleted
*/
socket.on('deleteMessageFromServer',function(data){
	document.getElementById(data['doubtId']).parentNode.parentNode.remove();
});
/*
	Function to send a new doubt
		Doubt content is extracted from "messageContainer" which is
		binded to text field for entering new doubt. After adding
		username and timestamp this doubt is sent to server to be
		broadcasted to all users
*/
function sentMessage(){
	if(messageContainer.val().trim()!=""){
		if(pseudo==""){
			$('#modalPseudo').modal('show');
		}
		else{
			var doubt_content = messageContainer.val();
			var date = Date().toString().split(' ')[4];
			addMessage("Unknown", 0 ,doubt_content,"ME",date,true);
			socket.emit('message',doubt_content);
			messageContainer.val('');
			submitButton.button('loading');
		}
	}
}
/*
	Function to delete a doubt
		doubtId : Id of the doubt to be deleted
	User is allowed to delete only his doubts
*/
function deleteMessage(doubtId){
	bootbox.confirm("Are you sure want to delete?", function(result) {
    	if(result) socket.emit('deleteMessage',doubtId);
    });
}
/*
	Function to add a new doubt in client's html
		Username shown in the doubt deoends on whether the
		concerned doubt belongs to this user or some other.
		This function is also used when populating the data from
		existing user session i.e. the case when username was
		picked up from the cookie
*/
function addMessage(doubtId,upvotes,msg,pseudo,date,self){
	var text = "";
	if(getCookie('userName')==pseudo){
		var classDiv = "rowMessageSelf row";
		text += '<div class="' + classDiv + '"><div class="col-md-11"><p style="word-wrap:break-word" > <b>' + "ME" + ' , '+ date + '</b>&nbsp&nbsp&nbsp' + msg +'</div>';
		text += '<div class="col-md-1" ><button id="'+ doubtId +  '" type="button" class="btn btn-default pull-right" onclick="deleteMessage('+ doubtId +')" ><span class="glyphicon glyphicon-remove"></span><span class="text">'+upvotes+'</span></button></div>';
	}
	else if(self){
		var classDiv = "rowMessageSelf row";
		text += '<div class="' + classDiv + '"><div class="col-md-11"><p style="word-wrap:break-word" > <b>' + pseudo + ' , '+ date + '</b>&nbsp&nbsp&nbsp' + msg +'</div>';
		text += '<div class="col-md-1" ><button id="'+ doubtId +  '" type="button" class="btn btn-default pull-right" onclick="deleteMessage('+ doubtId +')" ><span class="glyphicon glyphicon-remove"></span><span class="text">'+upvotes+'</span></button></div>';
	}
	else{
		var classDiv = "rowMessage row";
		text += '<div class="' + classDiv + '"><div class="col-md-11"><p style="word-wrap:break-word" > <b>' + pseudo + ' , '+ date + '</b>&nbsp&nbsp&nbsp' + msg + '</div>';
		text += '<div class="col-md-1"><button id="'+doubtId+'" value="OFF" type="button" onclick="upvoteFunction('+ doubtId +')" class="btn btn-default pull-right vote"><span class="glyphicon glyphicon-arrow-up"></span><span class="text">'+upvotes+'</span></button></div>';
	}
	$("#chatEntries").prepend(text);
	$('#messageInput').val('');
}
/*
	Binding submit button of new doubt form
*/
function bindButton(){
	submitButton.button('loading');
	messageContainer.on('input',function(){
		if(messageContainer.val()=="") submitButton.button('loading');
		else submitButton.button('reset');
	});
}
/*
	Function to set username of this client
		If there doesn't exist a user session and new username is
		asked through dialog box the chosen username is sent to
		server for verification. If server allocates the username
		then "pseudo" is set to requested username otherwise the
		dialogbox reappears saying that request username is taken
*/
function setPseudo(dialogItself){
	if(getCookie('userName')=="" && $("#pseudoInput").val()!=""){
		socket.emit('setPseudo',$("#pseudoInput").val());
		socket.on('pseudoStatus',function(data){
			if(data == "ok"){
				dialogItself.close();
				pseudo = $("#pseudoInput").val();
				setCookie( "userName", pseudo);
			}
			else BootstrapDialog.alert('Username already taken.');
		});
	}
	else BootstrapDialog.alert('Username field is empty.');
}
/*
	Function to change appearance of upvote button after clicked
		Upvote button toggles between being upvote button and
		downvote button
*/
function upvoteFunction(doubtId){
	socket.emit('upvote', doubtId);
	if(document.getElementById(doubtId).value == "OFF"){
		document.getElementById(doubtId).value = "ON";
		document.getElementById(doubtId).setAttribute("style","background-color:#AAA");

	}else{
		document.getElementById(doubtId).value = "OFF";
		document.getElementById(doubtId).setAttribute("style","background-color:none");
	}
}
/*
	Comparator used for sorting votes by number of upvotes
*/
function compareVote(a,b){
	var count1 = parseInt($(a).find(".btn .text").text());
	var count2 = parseInt($(b).find(".btn .text").text());
	return count1 < count2;
}
/*
	Comparator used for sorting votes by time
*/
function compareTime(a,b){
	var id1 = parseInt($(a).find(".vote")[0].id);
	var id2 = parseInt($(b).find(".vote")[0].id);
	return id1 < id2;
}
/*
	Function to be called when user chooses to sort the doubts
		based on one of the provided options
	Sort state is extracted from its HTML element. Sort functions
		are called on both randomly chosen doubts and rest of the
		doubtList. After that new doubtList is randArray
		concatenated with old doubtList
*/
function displaySorted(){
	sortState = $('.form-control :selected').index();
	var doubtList = $('#chatEntries > div');
	if(doubtList.length > numRandomDoubts){
		var randArray = [];
		for(i=0;i<numRandomDoubts;i++){
			randNum = Math.floor((Math.random() * doubtList.length));
			randArray.push(doubtList[randNum]);
			doubtList.splice(randNum,1);
		}
		if(sortState == 0){
			randArray.sort(compareTime);
			doubtList.sort(compareTime);
		}else if(sortState == 1){
			randArray.sort(compareTime).reverse();
			doubtList.sort(compareTime).get().reverse();
		}else if(sortState == 2){
			randArray.sort(compareVote);
			doubtList.sort(compareVote);
		}else if(sortState == 3){
			randArray.sort(compareVote).reverse();
			doubtList.sort(compareVote).get().reverse();
		}else{
			console.log("Should not reach here");
		}
		$('#chatEntries').empty();
		for(i=0;i<numRandomDoubts;i++){
			$('#chatEntries').append(randArray[i].outerHTML);
		}
		for(i=0;i<doubtList.length;i++){
			$('#chatEntries').append(doubtList[i].outerHTML);
		}
	}
}
/*
	Function to get a parameter value from the cookie if it exists
		cname : key for which value is desired
	This function is used to get username stored in cookie by passing
		"cname" as "username"
*/
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}
/*
	Function to set a key value pair in the cookie
		cname : key
		cvalue : value
		exdays : expiry time of the cookie in number in miliseconds
*/
function setCookie(cname, cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + cookieExpiryTime);
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}
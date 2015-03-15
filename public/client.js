var pseudo = "", messageContainer, submitButton;
var upvoteSorted = true;

// Init Function
$(function(){
	messageContainer = $('#messageInput');
	submitButton = $("#submit");
	bindButton();
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
	$("#pseudoSubmit").click(function(){
		setPseudo();
	});
	submitButton.click(function(){
		sentMessage();
	});
	$('#messageInput').keypress(function(e){
		if(e.which==13)
			sentMessage();
	});

	setInterval(function(){
		var doubtList = $('#chatEntries > div');
		if(doubtList.length > 5){
			var randArray = new Array();
			for(i=0;i<5;i++){
				randNum = Math.floor((Math.random() * doubtList.length));
				randArray.push(doubtList[randNum]);
				doubtList.splice(randNum,1);
			}
			if(upvoteSorted){
				randArray.sort(compareVote);
				doubtList.sort(compareVote);
			}
			else{
				randArray.sort(compareTime);
				doubtList.sort(compareTime);
			}
			$('#chatEntries').empty();
			for(i=0;i<5;i++){
				$('#chatEntries').append(randArray[i].outerHTML);
			}
			for(i=0;i<doubtList.length;i++){
				$('#chatEntries').append(doubtList[i].outerHTML);
			}
		}
	},5000);

});

// Socket Functions
var socket = io.connect();

socket.on('connect',function(){
	console.log('connected');
});


socket.on('nbUsers',function(msg){
	$("#nbUsers").html(msg.nb);
});

socket.on('message',function(data){
	addMessage(data.doubtId ,data.upvotes ,  data.message, data.pseudo, data.date, false);
	console.log(data.message + data.pseudo + data.date);
});

socket.on('updateVote',function(data){
	var id = data.doubtId;
	var count = data.count;
	$('#'+id+'> .text').html(count);
});

socket.on('setDoubtId',function(data){
	$("#Unknown").attr("onclick","upvoteFunction("+data+")");
	$("#Unknown").attr("id",data);
	$("#Unknown-delete").attr("onclick","deleteMessage("+data+")");
	$("#Unknown-delete").attr("id",''+data+'-delete');
});

// Helper Functions
function sentMessage(){
	if(messageContainer.val().trim()!=""){
		if(pseudo==""){
			$('#modalPseudo').modal('show');
		}
		else{
			var doubt_content = messageContainer.val();
			var date = new Date();
			date = date.toDateString()+" "+date.toLocaleTimeString();
			addMessage("Unknown", 0 ,doubt_content,"ME",date,true);
			socket.emit('message',doubt_content);
			messageContainer.val('');
			submitButton.button('loading');
		}
	}
}

function deleteMessage(doubtId){
	socket.emit('deleteMessage',doubtId);
	document.getElementById("" + doubtId + "-delete").parentNode.parentNode.remove();
}

function addMessage(doubtId,upvotes,msg,pseudo,date,self){

	var text = "";

	if(self){
		var classDiv = "rowMessageSelf";
		text += '<div class="' + classDiv + '"><p class="infos"><span class="pseudo">' + pseudo + '</span>, <time class="date" title="'+ date +'">' + date + '</time>';
		text += '<button id="'+doubtId+'-delete" type="button" class="btn btn-default pull-right" onclick="deleteMessage('+ doubtId +')" ><span class="glyphicon glyphicon-remove"></span></button>';
	}
	else{
		var classDiv = "rowMessage ";

		text += '<div class="' + classDiv + '"><p class="infos"><span class="pseudo">' + pseudo + '</span>, <time class="date" title="'+ date +'">' + date + '</time>';
	}

	text += '<button id="'+doubtId+'" value="OFF" type="button" onclick="upvoteFunction('+ doubtId +')" class="btn btn-default pull-right vote"><span class="glyphicon glyphicon-arrow-up"></span><span class="text">'+upvotes+'</span></button>    </p> <p style="word-wrap:break-word">' + msg + '</p></div>';

	$("#chatEntries").prepend( text );

	$('#messageInput').val('');
	// time();
}

function bindButton(){
	submitButton.button('loading');
	messageContainer.on('input',function(){
		if(messageContainer.val()=="")
			submitButton.button('loading');
		else
			submitButton.button('reset');
	});
}

function setPseudo(dialogItself){
	if($("#pseudoInput").val()!=""){
		socket.emit('setPseudo',$("#pseudoInput").val());
		socket.on('pseudoStatus',function(data){
			if(data == "ok"){
				dialogItself.close();
				pseudo = $("#pseudoInput").val();
			}
			else{
				BootstrapDialog.alert('Username already taken.');
			}
		});
	}
	else{
		BootstrapDialog.alert('Username field is empty.');
	}
}

function upvoteFunction(doubtId){
	console.log("yahin hai vo ::::::::::::::: " + doubtId);
	socket.emit('upvote', doubtId);
	if(  document.getElementById(doubtId).value == "OFF" ){
		document.getElementById(doubtId).value = "ON";
		document.getElementById(doubtId).setAttribute("style","background-color:#AAA");

	}else{
		document.getElementById(doubtId).value = "OFF";
		document.getElementById(doubtId).setAttribute("style","background-color:none");
	}
}

function compareVote(a,b){
	var count1 = parseInt( $(a).find(".btn .text").text() );
	var count2 = parseInt( $(b).find(".btn .text").text() );
	return count1 > count2;
}

function compareTime(a,b){
	var id1 = parseInt( $(a).find(".vote")[0].id );
	var id2 = parseInt( $(b).find(".vote")[0].id );
	return id1 < id2;
}

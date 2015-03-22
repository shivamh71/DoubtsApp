var pseudo = "", messageContainer, submitButton;
var sortState = 0;
// 0 - Most Recent First
// 1 - Most Recent Last
// 2 - Most Upvoted First
// 3 - Most Upvoted Last

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
			if(sortState == 0){
				randArray.sort(compareTime);
				doubtList.sort(compareTime);
			}
			else if(sortState == 1){
				randArray.sort(compareTime).reverse();
				doubtList.sort(compareTime).reverse();
			}
			else if(sortState == 2){
				randArray.sort(compareVote);
				doubtList.sort(compareVote);
			}
			else if(sortState == 3){
				randArray.sort(compareVote).reverse();
				doubtList.sort(compareVote).reverse();
			}else{
				console.log("Should not reach here !")
			}
			$('#chatEntries').empty();
			for(i=0;i<5;i++){
				$('#chatEntries').append(randArray[i].outerHTML);
			}
			for(i=0;i<doubtList.length;i++){
				$('#chatEntries').append(doubtList[i].outerHTML);
			}
		}
	},5000000);

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
	$("#Unknown").attr("onclick","deleteMessage("+data+")");
	$("#Unknown").attr("id",''+data);
});

socket.on('deleteMessageFromServer',function(data){	
	console.log("sakdkasdh "+data['doubtId']);
	document.getElementById(data['doubtId']).parentNode.parentNode.remove();
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
}

function addMessage(doubtId,upvotes,msg,pseudo,date,self){

	var text = "";

	if(self){
		var classDiv = "rowMessageSelf";
		text += '<div class="' + classDiv + '"><p class="infos"><span class="pseudo">' + pseudo + '</span>, <time class="date" title="'+ date +'">' + date + '</time>';
		text += '<button id="'+ doubtId +  '" type="button" class="btn btn-default pull-right" onclick="deleteMessage('+ doubtId +')" ><span class="glyphicon glyphicon-remove"></span><span class="text">'+upvotes+'</span></button>';
	}
	else{
		var classDiv = "rowMessage ";

		text += '<div class="' + classDiv + '"><p class="infos"><span class="pseudo">' + pseudo + '</span>, <time class="date" title="'+ date +'">' + date + '</time>';
		text += '<button id="'+doubtId+'" value="OFF" type="button" onclick="upvoteFunction('+ doubtId +')" class="btn btn-default pull-right vote"><span class="glyphicon glyphicon-arrow-up"></span><span class="text">'+upvotes+'</span></button>'; 
	}

	text += '</p><p style="word-wrap:break-word">' + msg + '</p></div>';

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

function compareVoteUp(a,b){
	var count1 = parseInt( $(a).find(".btn .text").text() );
	var count2 = parseInt( $(b).find(".btn .text").text() );
	return count1 < count2;
}
function compareVoteDown(a,b){
	var count1 = parseInt( $(a).find(".btn .text").text() );
	var count2 = parseInt( $(b).find(".btn .text").text() );
	return count1 > count2;
}

function compareTimeUp(a,b){
	var id1 = parseInt( $(a).find(".vote")[0].id );
	var id2 = parseInt( $(b).find(".vote")[0].id );
	return id1 < id2;
}
function compareTimeDown(a,b){
	var id1 = parseInt( $(a).find(".vote")[0].id );
	var id2 = parseInt( $(b).find(".vote")[0].id );
	return id1 > id2;
}

function displaySorted(){
	sortState = $('.form-control :selected').index();
	var doubtList = $('#chatEntries > div');
	if(doubtList.length > 5){
		var randArray = [];
		for(i=0;i<5;i++){
			randNum = Math.floor((Math.random() * doubtList.length));
			randArray.push(doubtList[randNum]);
			doubtList.splice(randNum,1);
		}
		if(sortState == 0){
			randArray.sort(compareTimeUp);
			doubtList.sort(compareTimeUp);
		}
		else if(sortState == 1){
			randArray.sort(compareTimeDown);
			doubtList.sort(compareTimeDown);
		}		
		else if(sortState == 2){
			randArray.sort(compareVoteUp);
			randArray = randArray.get.reverse();
			doubtList.sort(compareVoteUp);
			doubtList = doubtList.get.reverse();
		}
		else if(sortState == 3){
			randArray.sort(compareVoteDown)
			doubtList.sort(compareVoteDown);
		}
		$('#chatEntries').empty();
		for(i=0;i<5;i++){
			$('#chatEntries').append(randArray[i].outerHTML);
		}
		for(i=0;i<doubtList.length;i++){
			$('#chatEntries').append(doubtList[i].outerHTML);
		}
	}
		
	console.log(sortState + ":: SORTSTATE");
}

$('.form-control').click(function(){
	console.log( "YOLO" );
});
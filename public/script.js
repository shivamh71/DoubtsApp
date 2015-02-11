var pseudo = "", messageContainer, submitButton;

// Init Function
$(function(){
	messageContainer = $('#messageInput');
	submitButton = $("#submit");
	bindButton();
	window.setInterval(time, 1000*10);
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
	// ("#chatEntries").slimScroll({height:'60%'}); // height changed here
	submitButton.click(function(){
		sentMessage();
	});
	// setHeight();
	$('#messageInput').keypress(function(e){
		if(e.which==13)
			sentMessage();
	});
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
	addMessage(data['message'], data['pseudo'], new Date().toISOString(), false);
	console.log(data);
});

// Helper Functions
function sentMessage(){
	if(messageContainer.val()!=""){
		if(pseudo==""){
			$('#modalPseudo').modal('show');
		}
		else{
			socket.emit('message',messageContainer.val());
			addMessage(messageContainer.val(),"ME",new Date().toISOString(),true);
			messageContainer.val('');
			submitButton.button('loading');
		}
	}
}

function addMessage(msg,pseudo,date,self){
	if(self)
		var classDiv = "rowMessageSelf";
	else
		var classDiv = "rowMessage ";
	$("#chatEntries").prepend('<div class="' + classDiv + '"><p class="infos"><span class="pseudo">' + pseudo + '</span>, <time class="date" title="'+ date +'">' + date + '</time></p><p style="word-wrap:break-word">' + msg + '</p></div>');
	$('#messageInput').val('');
	time();
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

function time(){
	$("time").each(function(){
		$(this).text($.timeago($(this).attr('title')));
	});
}

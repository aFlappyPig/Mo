function canlogin(){
	var flag = true;
	$(".login-form-input input").each(function(){
		if($(this).val() === ""){
			flag =false;
		}
	});

	if(flag === true){
		$(".login-form-button").css({"background-color":"#0e9496", "color":"#fff"}).addClass("clickable");
	}else{
		$(".login-form-button").css({"background-color":"#36383d", "color":"#727375"}).removeClass("clickable");
	}
	return false;
}

function startWebSocket(username, password) {
	databus.connect(wsip, wsport, path, {
		onConnectSuccess: function(){
			login(username, password);
		}
	});
	databus.setPushDataFactory(function(topic, jsonContent) {
		parsePublishData(topic, jsonContent);
	});
}

function parsePublishData(topic, jsonContent) {
	if (topic == TOPIC_CLIENT_MSG || topic == TOPIC_CLIENT_ROOM_MSG || topic == TOPIC_CLIENT_MASS_MSG) {

		var toId;
		var fromId;
		var msg;
		for (var i = 0; i < jsonContent.length; i++) {
			if (jsonContent[i].key == KEY_CLIENT_TO_ID) {
				toId = jsonContent[i].value;
			} else if (jsonContent[i].key == KEY_CLIENT_FROM_ID) {
				fromId = jsonContent[i].value;
			} else if (jsonContent[i].key == KEY_CLIENT_MSG) {
				msg = databus.builderClass("qmppsm", "SM.SMMessage").decode(
					ByteBuffer.fromBinary(jsonContent[i].value));
			}
		}
		databus.notifyPublishData(topic, toId, fromId, msg,
			topic == TOPIC_CLIENT_ROOM_MSG);
	}
}

function login(username, password) {//用户登陆
	databus.requestOnce(COMMAND_ACCOUNT_LOGIN, "monitor", "monitor.AccountReq", "monitor.AccountRes", {
			fillRequest : function(request) {
				request.account = username;
				request.password = hex_md5(password);
			},
			handleResponse : function(response) {
				if (response.ret == 0) {
					token = response.token;
					userid = response.userid;
					companyid = response.companyid;
					accountId = response.accountid;

					if($(".checkbox-container input").is(":checked")) {
						//存储一个带365 天期限的cookie
						$.cookie("username", username, {expires: 365});
						$.cookie("password", password, {expires: 365});
						$.cookie("bit", "true", {expires: 365});
					}

					console.log("login success,token=" + token + ", id:" + accountId);

					gatewaylogin();//登录网关，订阅实时聊天
				} else {
					$(".login-form-error").show().text("用户名或密码错误，请重新输入。");
					console.log(response.ret);
				}
			},
			handleOnDisconnect : function() {
				console.log("connection is disconnect");

				$(".coverIng span").text("连接已中断，请重新登录。");
				if(window.confirm("连接已中断，请点击确定重新登录。")) {
					databus.close();
					window.location.reload();
				}
			}
		});
}

var intervalId;
function startHeartBeatThread() {
	intervalId = setInterval(sendHeartBeat, 20000);
}

function sendHeartBeat() {
	databus
		.requestOnce(
		COMMAND_DATABUS_HEART_BEAT,
		"msgexpress",
		"MsgExpress.HeartBeat",
		"MsgExpress.HeartBeatResponse",
		{
			fillRequest : function(request) {
				console.log(" - Send HeartBeat Request To Gateway");
				request.cpu = 0;
				request.topmemory = 0;
				request.memory = 0;
				request.sendqueue = 0;
				request.receivequeue = 0;
			},
			handleResponse : function(response) {
				console
					.log(" - Receive HeartBeatResponse From Gateway, retCode:"
					+ response.retcode);
			},
			handleOnDisconnect : function() {
				console.log("connection is disconnect");

				$(".coverIng span").text("连接已中断，请重新登录。");
				if(window.confirm("连接已中断，请点击确定重新登录。")) {
					databus.close();
					window.location.reload();
				}
			}
		});
}

function gatewaylogin() {//登陆网关
	databus.requestOnce(COMMAND_GATEWAY_LOGIN, "gateway", "Gateway.Login", "Gateway.CommonResponse", {
		fillRequest : function(request) {
			request.token = token;
		},
		handleResponse : function(response) {
			if (response.retcode == 0) {
				showMessage("Gateway login success");
				$("#login_panel").css("display", "none");
				$("#monitor_panel").css("display", "");

				startHeartBeatThread();//发心跳线程

				getAllUsers();
			}
		},
		handleOnDisconnect : function() {
			console.log("connection is disconnect");

			$(".coverIng span").text("连接已中断，请重新登录。");
			if(window.confirm("连接已中断，请点击确定重新登录。")) {
				databus.close();
				window.location.reload();
			}
		}
	});
}
function getAllUsers(){
	databus.requestOnce(COMMAND_REQUEST_ALL_USER, "monitor", "monitor.AllUserInfoReq", "monitor.ALLUserInfoRes", {
		fillRequest: function (request) {
			request.companyid = companyid;
			request.token = token;
		},
		handleResponse: function (response) {
			showMessage("response all user retcode:" + response.errorCode);
			if (response.errorCode != 0)
				return;

			allUsers = response.userInfo;
			for (var i = 0; i < allUsers.length; i++) {
				allUserIds.push(allUsers[i].userInfo.userID);

				var content = "";

				var name = allUsers[i].userInfo.name;
				var userid = allUsers[i].userInfo.userID;
				var description = allUsers[i].status;

				//var buffer = allUsers[i].userInfo.avatar;

				var image;
				//if (allUsers[i].userInfo.avatarId < 10000 || buffer.toString("base64") == "") {
					image = getImagePath() + "person_36.png";
				//} else {
				//	image = "data:image/jpg;base64," + buffer.toString("base64");
				//}

				content += "<li  userid=" + userid + " class=\"list-person\">"
						+ "<img class=\"person-head\" src=\"" + image + "\">"
						+ "<span class=\"person-name\">" + escapeChar(name) + "</span>"
						+ "<span class=\"person-remark\">" + escapeChar(description)
						+ "</span>" + "</li>";

				$(".monitor-member-list.person").append(content).getNiceScroll().resize();
			}

			databus.requestPublishData(TOPIC_CLIENT_MSG, dispatchPublishSMMessageByUser);
			requestMonitorUserChatEx(token, SUBID_TO, TOPIC_CLIENT_MSG, KEY_CLIENT_TO_ID, allUserIds);
			requestMonitorUserChatEx(token, SUBID_FROM, TOPIC_CLIENT_MSG, KEY_CLIENT_FROM_ID, allUserIds);

			databus.requestPublishData(TOPIC_CLIENT_MASS_MSG, dispatchPublishSMMessage);
			requestMonitorUserChatEx(token, SUBID_MASS_TO, TOPIC_CLIENT_MASS_MSG, KEY_CLIENT_TO_ID, allUserIds);
			requestMonitorUserChatEx(token, SUBID_MASS_FROM, TOPIC_CLIENT_MASS_MSG, KEY_CLIENT_FROM_ID, allUserIds);
		},
		handleOnDisconnect : function() {
			console.log("connection is disconnect");

			$(".coverIng span").text("连接已中断，请重新登录。");
			if(window.confirm("连接已中断，请点击确定重新登录。")) {
				databus.close();
				window.location.reload();
			}
		}
	});
}
function getAllGroups(){
	var roomIds = [];
	databus.requestOnce(COMMAND_GET_All_GROUPS,"infoserver","InfoServer.ISReqAllCompanyRoomIdList","InfoServer.ISResAllCompanyRoomIdList", {
		fillRequest: function (request) {
			request.companyId = companyid;
		},
		handleResponse: function (response) {
			if(response.errorCode == 0){
				roomIds = response.roomIdList;
				this.requestRooms(roomIds);
			}
		},
		requestRooms : function(roomIds) {
		databus
			.requestOnce(
			COMMAND_REQUEST_ROOM_INFO,
			"infoserver",
			"InfoServer.ISReqUserRoomInfo",
			"InfoServer.ISResUserRoomInfo",
			{
				fillRequest : function(info) {
					info.userId = parseInt(userid);
					info.roomId = roomIds;
					var versions = [];
					for (var i = 0; i < roomIds.length; i++) {
						versions.push(0);
					}
					info.version = versions;
					info.reqMember = true;
					info.reqOwner = true;
					console.log("send");
				},
				handleResponse : function(response) {
					var rooms = allGroups = response.roomInfo;
					console.log("receive");
					var roomitem = "";
					for (var i = 0; i < rooms.length; i++) {
						allGroupIds.push(rooms[i].ID);

						if(rooms[i].memberInfo.length > 0) {
							groupOwner['"' + rooms[i].ID + '"'] = [];
							groupOwner['"' + rooms[i].ID + '"'] = rooms[i].memberInfo[0].id;
						}else{
							console.log(rooms[i].ID);
						}

						roomitem += '<li roomid="' + rooms[i].ID + '" class="list-room">' +
							'<img class="room-head" src="./img/room_36.png">' +
							'<span class="room-name">' + rooms[i].name + '</span></li>';
					}
					$(".monitor-member-list.group").append(roomitem).getNiceScroll().resize();

					databus.requestPublishData(TOPIC_CLIENT_ROOM_MSG, dispatchPublishSMMessageByRoom);
					requestMonitorUserChatEx(token, SUBID_ROOM_FROM, TOPIC_CLIENT_ROOM_MSG, KEY_CLIENT_TO_ID, allGroupIds);
					requestMonitorUserChatEx(token, SUBID_MASS_ROOM_FROM, TOPIC_CLIENT_MASS_MSG, KEY_CLIENT_TO_ID, allGroupIds);
				}
			});
	},
		handleOnDisconnect : function() {
			console.log("connection is disconnect");

			$(".coverIng span").text("连接已中断，请重新登录。");
			if(window.confirm("连接已中断，请点击确定重新登录。")) {
				databus.close();
				window.location.reload();
			}
		}
	});
}

function dispatchPublishSMMessageByUser(toId, fromId, msg){//toId, fromId, msg, isroom, append, ifpublish, ishistory
	dispatchPublishSMMessageEx(toId, fromId, msg, false, true, true, false);
}

function dispatchPublishSMMessageByRoom(toId, fromId, msg){
	dispatchPublishSMMessageEx(toId, fromId, msg, true, true, true, false);
}

function dispatchPublishSMMessage(toId, fromId, msg, isroom) {
	dispatchPublishSMMessageEx(toId, fromId, msg, isroom, true, true, false);
}
//查历史

var pmsgcount = 0;
var pmsgs = [];
var plastsendtime;
var pmsgslen = 0;
function requestMessageByUser(lastSendTime) {//uStart,uEnd
	var mydate = new Date();
	var year = mydate.getFullYear();
	var month = mydate.getMonth()+1;
	var day = mydate.getDate();
	var today = year + "-" + month +"-" + day;
	var searchpanel = $(".monitor-search" + "." + mtitle + "." + mtype);

	if($("body").find(".covercover").length == 0) {
		$("body").append('<div class="covercover"></div><div class="cover_content"><div class="coverIng"><span>正在加载，请稍等...</span></div></div>');
	}
	databus.requestOnce(COMMAND_REQUEST_MESSAGE_BY_USER, "monitor", "monitor.MessageReqByUser", "monitor.MessageResCommon", {
		fillRequest : function(request) {
			request.useridStart = uStart;
			request.useridEnd = uEnd;
			request.count = -50;
			if(searchpanel.find(".monitor_start_time").val() != "") {
				request.startTime = searchpanel.find(".monitor_start_time").val();
			}else{
				request.startTime = "";
			}

			if (lastSendTime != null) {
				request.lastSendTime = lastSendTime;
			}else{
				request.lastSendTime = mydate.getTime();
			}

			if(searchpanel.find(".monitor_end_time").val() != ""){
				request.endTime = searchpanel.find(".monitor_end_time").val();
			}else{
				request.endTime = today;
			}
		},
		handleResponse : function(response) {

			$(".optbtn.search").show();
			$(".optspan.search").remove();

			$(".coverIng span").text("加载完成");

			$('.cover_content').delay(100).fadeOut(100, function() {
				$('.covercover').remove();
				$('.cover_content').remove();
				$(".sysmsg-content").empty();
			});

			if(response.messages.length > 0) {
				var msg,from;
				pmsgslen = response.messages.length;

				for (var i = response.messages.length - 1; i >= 0; i--) {

					msg = response.messages[i];
					from = msg.header.from;
					plastsendtime = msg.time;

					if(parseInt(from) >= 988900000 && parseInt(from) <= 989000000 && parseInt(from) != 988999002 ){
					}else{
						pmsgcount++;
						pmsgs.push(msg);
					}
					if(pmsgcount == 50){
						break;
					}
				}
				if(pmsgslen == 50 && pmsgcount < 50){
					requestMessageByUser(plastsendtime);
				}else{
					for(var j = 0;j < pmsgcount;j++){
						dispatchPublishSMMessageEx(null, null, pmsgs[j], false, false, false, true);
					}

					pmsgcount = 0;
					pmsgs = [];

					var tag = $(".monitor-message-list.history.person");
					if(tag.find("li").length <= 50) {//一次加载50条，第一次加载之后，滚动条置底，向上滚动至顶，加载新数据，页面滚动刚刚浏览的内容区域；
						ssScroll(tag).pullDown();
					}else {
						var len = tag.find("li").length;
						if(len % 50 == 0) {//每加载50条，回滚一次滚动条；
							pHeight2 = tag[0].scrollHeight;
							bar[3].doScrollTo((pHeight2 - pHeight1), 10);
						}
					}
				}
			}else{
				if($(".monitor-message-list.history.person li").length == 0) {
					$(".monitor-message-list.history.person").text('无搜索结果！');
				}
			}


		},
		handlerError : function(error) {
			console.log("Error Message, Code:" + error.errcode + ", Message:" + error.errmsg);
		},
		handleOnDisconnect : function() {
			console.log("connection is disconnect");

			$(".coverIng span").text("连接已中断，请重新登录。");
			if(window.confirm("连接已中断，请点击确定重新登录。")) {
				databus.close();
				window.location.reload();
			}
		}
	});
}

var gmsgcount = 0;
var gmsgs = [];
var glastsendtime;
var gmsglen = 0;
function requestMessageByRoom(lastSendTime) {//roomIds,uId,isShowSelfCompany,UserIds
	var mydate = new Date();
	var year = mydate.getFullYear();
	var month = mydate.getMonth()+1;
	var day = mydate.getDate();
	var today = year + "-" + month +"-" + day;
	var searchpanel = $(".monitor-search" + "." + mtitle + "." + mtype);

	if(lastSendTime != null) {
		var date = new Date();
		date.setTime(lastSendTime);
		var result = date.isSameDay() ? date.Format("hh:mm:ss") : date.Format("yyyy-MM-dd hh:mm:ss");
	}

	if($("body").find(".covercover").length == 0) {
		$("body").append('<div class="covercover"></div><div class="cover_content"><div class="coverIng"><span>正在加载，请稍等...</span></div></div>');
	}
	databus.requestOnce(COMMAND_REQUEST_MESSAGE_BY_ROOM, "monitor", "monitor.MessageReqByRoom", "monitor.MessageResCommon", {
		fillRequest : function(request) {
			request.roomIds = roomIds;
			request.count = -50;
			if(searchpanel.find(".monitor_start_time").val() != "") {
				request.startTime = searchpanel.find(".monitor_start_time").val();
			}else{
				request.startTime = "";
			}

			if (lastSendTime != null) {
				request.lastSendTime = lastSendTime;
			}else{
				request.lastSendTime = mydate.getTime();
			}

			if(searchpanel.find(".monitor_end_time").val() != ""){
				request.endTime = searchpanel.find(".monitor_end_time").val();
			}else{
				request.endTime = today;
			}
			request.userId = uId;
			request.isShowSelfCompany = isShowSelfCompany;
			request.allUserIds = UserIds;

		},
		handleResponse : function(response) {

			$(".optbtn.search").show();
			$(".optspan.search").remove();

			$(".coverIng span").text("加载完成");

			$('.cover_content').delay(100).fadeOut(100, function() {
				$('.covercover').remove();
				$('.cover_content').remove();
				$(".sysmsg-content").empty();
			});

			gmsglen = response.messages.length;

			if(response.messages.length > 0) {
				var msg,from;
				for (var i = response.messages.length - 1; i >= 0; i--) {

					msg = response.messages[i];
					from = msg.header.from;
					glastsendtime = msg.time;

					if(parseInt(from) >= 988900000 && parseInt(from) <= 989000000 && parseInt(from) != 988999002 ){
					}else{
						gmsgcount++;
						gmsgs.push(msg);
					}
					if(gmsgcount == 50){
						break;
					}
				}
				if(gmsglen == 50 && gmsgcount < 50){
					requestMessageByRoom(glastsendtime);
				}else{
					for(var j = 0;j < gmsgcount;j++){
						dispatchPublishSMMessageEx(null, null, gmsgs[j], true, false, false, true);
					}

					gmsgcount = 0;
					gmsgs = [];

					var tag = $(".monitor-message-list.history.group");
					if(tag.find("li").length <= 50) {//一次加载50条，第一次加载之后，滚动条置底，向上滚动至顶，加载新数据，页面滚动刚刚浏览的内容区域；
						ssScroll(tag).pullDown();
					}else {
						var len = tag.find("li").length;
						if(len % 50 == 0) {//每加载50条，回滚一次滚动条；
							gHeight2 = tag[0].scrollHeight;
							bar[2].doScrollTo((gHeight2 - gHeight1), 10);
						}
					}
				}
			}else{
				if($(".monitor-message-list.history.group li").length == 0) {
					$(".monitor-message-list.history.group").text('无搜索结果！');
				}
			}
		},
		handleOnDisconnect : function() {
			console.log("connection is disconnect");

			$(".coverIng span").text("连接已中断，请重新登录。");
			if(window.confirm("连接已中断，请点击确定重新登录。")) {
				databus.close();
				window.location.reload();
			}
		}
	});
}
//解包
var messageId = 0;
function dispatchPublishSMMessageEx(toId, fromId, msg, isroom, append, ifpublish, ishistory) {
	if (fromId == null) {
		fromId = msg.header.from;
	}
	if(parseInt(fromId) >= 988900000 && parseInt(fromId) <= 989000000 && parseInt(fromId) != 988999002 ){return;}//屏蔽机构号信息&& parseInt(fromId) != 988999002（森浦提醒）
	if (toId == null) {
		toId = msg.to[0];
	}

	var roomId=0;
	if(parseInt(toId) > 1000000000){
		isroom = true;
		roomId = toId;
	}
	var toUser =  getCompanyUser(toId);
	var fromUser = getCompanyUser(fromId);

	var tt = msg.time.toString();
	var bodyList = databus.builderClass("QMClient", "QMClient.MessageBodyList").decode(msg.body);
	var contents = getMsgContent(bodyList);
	var content = contents.content;
	var bodyListType = bodyList.bodyListType;
	if(bodyListType == 2) {
		var RobotMessageInfo = databus.builderClass("QMClient", "QMClient.RobotMessageInfo").decode(bodyList.ExtendContent);
		var RMIName = RobotMessageInfo.name;
		var RMIOrgName = RobotMessageInfo.orgname;
		var sayextend = RobotMessageInfo.sayextend;
		content = RMIName + '(' + RMIOrgName + ')' + sayextend + '<br />' + contents.content;
	}

	var textContent = contents.textContent;
	messageId++;
	var fromName = "未知";
	var fromCompanyName = null;
	var nameNode, companyNode, requestUserId = null;
	if (fromUser != null) {
		fromName = fromUser.userInfo.name;
		if ((fromCompanyName = getCompanyName(fromUser.userInfo.companyId)) == null) {
			showCompanyName(fromUser.userInfo.companyId, "fromCompanyName" + messageId);
		}
	} else {
		nameNode = "fromName" + messageId;
		companyNode = "fromCompanyName" + messageId;

		getUserInfo(fromId,nameNode,companyNode);
	}
	var toName = "未知";
	var toCompanyName = null;
	if (toUser != null) {
		toName = toUser.userInfo.name;
		if ((toCompanyName = getCompanyName(toUser.userInfo.companyId)) == null) {
			showCompanyName(toUser.userInfo.companyId, "toCompanyName" + messageId);
		}
	} else {
		nameNode = "toName" + messageId;
		companyNode = "toCompanyName" + messageId;
		if(isroom){
			getRoomInfo(toId,nameNode);
		}else{
			getUserInfo(toId,nameNode,companyNode);
		}
	}

	var date = new Date();
	date.setTime(msg.time.toString());

	var tag,stag;

	if(isroom && ifpublish){
		tag = $(".monitor-message-list.group.real");
		stag = $(".monitor-search.group.real");
	}
	if(isroom && ishistory){
		tag = $(".monitor-message-list.group.history");
		stag = $(".monitor-search.group.history");
	}
	if(!isroom && ifpublish){
		tag = $(".monitor-message-list.person.real");
		stag = $(".monitor-search.person.real");
	}
	if(!isroom && ishistory){
		tag = $(".monitor-message-list.person.history");
		stag = $(".monitor-search.person.history");
	}

	var cls1 = "",cls2 = "",cls0 = "";
	if(stag.find(".input_first").attr("userid") == fromId){
		cls1 = "yellow";
	}else{
		cls1 = "";
	}

	if(stag.find(".input_first").attr("userid") == toId){
		cls2 = "yellow";
	}else{
		cls2 = "";
	}

	if(ifpublish){
		if(isroom){//群消息
			var suserid = "";
			var suserval = stag.find(".monitor-operate-input.input_first").val();
			if(suserval != ""){
				suserid = stag.find(".monitor-operate-input.input_first").attr("userid");
			}

			if (realroomid.length == 1 && realroomid[0] != toId){//选中群,当前消息不属于选中群，隐藏
				cls0 = "none";
				cls1 = "";
			}else {//全部群或者选中某群后
				if(suserid != "" && suserid != fromId){//指定员工，但是当前消息不是此员工发出的，隐藏
					cls0 = "none";
					cls1 = "";
				}else{//没有指定员工，先显示
					cls0 = "";
					cls1 = "";

					if (stag.find(".switch").hasClass("active")) {//只显示本公司人的聊天
						for (var i = 0; i < allUserIds.length; i++) {//过滤本公司人，是本公司人的就显示，不是本公司人的就隐藏；
							if (allUserIds[i].equals(fromId.toString())) {
								cls0 = "";
								cls1 = "";
								break;
							} else {
								cls0 = "none";
								cls1 = "";
								continue;
							}
						}
					}
				}
			}
		}else {//人与人
			var obj1 = stag.find(".monitor-operate-input.input_first");
			var obj2 = stag.find(".monitor-operate-input.input_second");
			if (obj1.val() != "" && obj2.val() != "") {
				if ((obj1.attr("userid") == fromId && obj2.attr("userid") == toId) || (obj1.attr("userid") == toId && obj2.attr("userid") == fromId)) {
					cls0 = "";
					cls1 = "";
				} else {
					cls0 = "none";
					cls1 = "";
				}
			} else if (obj1.val() != "" && obj2.val() == "") {
				if (obj1.attr("userid") == fromId || obj1.attr("userid") == toId) {
					cls0 = "";
					cls1 = "";
				} else {
					cls0 = "none";
					cls1 = "";
				}
			} else if (obj1.val() == "" && obj2.val() != "") {
				if (obj2.attr("userid") == fromId || obj2.attr("userid") == toId) {
					cls0 = "";
					cls1 = "";
				} else {
					cls0 = "none";
					cls1 = "";
				}
			}
		}
	}

	var html = "<li msgId=" + messageId + " seqId=" + msg.id +" fromid=\"" + fromId + "\"" +" toid=\"" + toId + "\"" + " roomid=\"" + roomId + "\""   + " lastSendTime=" +  msg.time + " type=" + msg.type
			+ " class=\"list-message " + cls0 + "\">"
			+ "<p class=\"msg-title\"><span id=\"fromName" + messageId + "\" userid=\""+fromId+"\" class=\"from "+cls1+"\">"
			+ fromName + "</span> - <span id=\"fromCompanyName" + messageId
			+ "\">" + (fromCompanyName == null ? "" : fromCompanyName)
			+ "</span>";

	if (isroom) {
		html += " 在  <span id=\"toName" + messageId + "\" roomid=\""+ roomId +"\">" + toName
				+ "</span>";
	} else {
		html += " 对 <span id=\"toName" + messageId + "\" userid=\""+toId+"\"  class=\"to "+cls2+"\">" + toName
				+ "</span>- <span id=\"toCompanyName" + messageId + "\">"
				+ (toCompanyName == null ? "" : toCompanyName) + "</span>";
	}

	var time = (date.isSameDay() ? date.Format("hh:mm:ss") : date.Format("yyyy-MM-dd hh:mm:ss"));
	html += "</p>"
			+ content
			+ "<span class=\"msg-time\">"
			+ time + "</span></li>";


	if(ifpublish){
		var gh = $(".monitor-message-list.real.group").height();
		var ph = $(".monitor-message-list.real.person").height();

		var gy = bar[0].scroll.y;
		var gch = bar[0].cursorheight;

		var py = bar[1].scroll.y;
		var pch = bar[1].cursorheight;

		tag.append(html).getNiceScroll().resize();

		if((mtype == "group" && (gy + gch) == gh) || (mtype == "person" && (py + pch) == ph)){//确定滚动条位置是不是在最下面，如果是，则滚动条自动下拉；
			ssScroll(tag).pullDown();
		}

	}else{
		tag.prepend(html);

		if(getStrTrim($("#keyword").val()) != ""){
			highlight();
		}
	}
}

function computeAttachSize(size) {
	var value;
	if (parseInt((value = size / 1024)) == 0) {
		return (value * 1024).toFixed(2) + "B";
	} else if (parseInt((value = size / (1024 * 1024))) == 0) {
		return (value * 1024).toFixed(2) + "KB";
	} else if (parseInt((value = size / (1024 * 1024 * 1024))) == 0) {
		return (value * 1024).toFixed(2) + "M";
	}
	return (value = size / (1024 * 1024 * 1024)).toFixed(2) + "G";
}

function createImageByFileName(fileName) {
	var name = "qm_file";
	if (fileName != null && fileName != "undefined") {
		if (fileName.endWith(".txt")) {
			res = "qm_file_text";
		} else if (fileName.endWith(".pdf")) {
			res = "qm_file_pdf";
		} else if (fileName.endWith(".doc")) {
			res = "qm_file_doc";
		}
	}
	return getImagePath() + name + ".png";
}

function createEmojiHtml(emojiName) {
	var suffix = ".png";
	var prefix = ":/face/";
	var index = emojiName.lastIndexOf(suffix);
	var start = prefix.length;
	var cn = emojiName.substring(start, index);
	var img = "emoji_" + cn + ".png";
	return "<img class=\"emotion\" src=" + getImagePath() + img + ">";
}

function getCompanyUser(userId) {
	var user = null;
	for (var i = 0; i < allUserIds.length; i++) {
		if (allUserIds[i].equals(userId)) {
			user = allUsers[i];
			break;
		}
	}
	return user;
}

function getUserInfo(userId,nameNode,companyNode){
	databus.subscribeInfo("",userId, function(userDetail) {
		$("#" + nameNode).text(userDetail.userInfo.name);
		// show company name
		if(userDetail.userInfo.companyId != null) {
			showCompanyName(userDetail.userInfo.companyId, companyNode);
		}
	});

	databus.requestOnce(COMMAND_REQUEST_USER, "infoserver", "InfoServer.ISReqUserInfo", "InfoServer.ISResUserInfo", {
		fillRequest : function(info) {
			info.ownerId = 0;
			info.detail = true;
			info.version = [ 0 ];
			info.userId = [ userId ];
		},
		handleResponse : function(response) {
			if(response.userInfo.length == 0) {
				console.log("can not get userinfo id:"+this.userId);
			}else {
				var userDetail = response.userInfo[0];
				databus.publishInfo("", userDetail.userInfo.userID, userDetail);
			}
		},
		handleOnDisconnect : function() {
			console.log("connection is disconnect");

			$(".coverIng span").text("连接已中断，请重新登录。");
			if(window.confirm("连接已中断，请点击确定重新登录。")) {
				databus.close();
				window.location.reload();
			}
		},
		userId:userId
	});
}

function getRoomInfo(roomId,nameNode){
	databus.subscribeInfo("room", roomId, function(roomInfo) {
		$("#" + nameNode).text(roomInfo.name);
	});
	databus.requestOnce(COMMAND_REQUEST_ROOM, "infoserver", "InfoServer.ISReqUserRoomInfo", "InfoServer.ISResUserRoomInfo", {
		fillRequest : function(info) {
			info.userId = userid;
			info.roomId = [ roomId ];
			info.version = [ 0 ];
			info.reqMember = false;
			info.reqOwner = false;
		},
		handleResponse : function(response) {
			if(response.roomInfo.length > 0) {
				var roomInfo = response.roomInfo[0];
				databus.publishInfo("room", roomInfo.ID, roomInfo);
			}
		},
		handleOnDisconnect : function() {
			console.log("connection is disconnect");

			$(".coverIng span").text("连接已中断，请重新登录。");
			if(window.confirm("连接已中断，请点击确定重新登录。")) {
				databus.close();
				window.location.reload();
			}
		}
	});
}

function exportToPDF(lastSendTime){
	var mydate = new Date();
	var year = mydate.getFullYear();
	var month = mydate.getMonth()+1;
	var day = mydate.getDate();
	var today = year + "-" + month +"-" + day;
	var monthago = year + "-" + (month-1) + "-" + day;

	databus.requestOnce(COMMAND_EXPORT_MESSAGE_PDF, "monitor", "monitor.ExportFileReqCommon", "monitor.ExportFileResCommon", {
		fillRequest : function(request) {
			var req;
			if(mtype == "person") {
				req = databus.builderObj("monitor", "monitor.MessageReqByUser");
				req.useridStart = uStart;
				req.useridEnd = uEnd;
				req.count = 0;
				if($(".monitor-search" + "." + mtitle + "." + mtype).find(".monitor_start_time").val() != "") {
					req.startTime = $(".monitor-search" + "." + mtitle + "." + mtype).find(".monitor_start_time").val();
				}else{
					req.startTime = monthago;
				}
				if (lastSendTime != null) {
					req.lastSendTime = lastSendTime;
				}else{
					req.lastSendTime = mydate.getTime();
				}

				if($(".monitor-search" + "." + mtitle + "." + mtype).find(".monitor_end_time").val() != ""){
					req.endTime = $(".monitor-search" + "." + mtitle + "." + mtype).find(".monitor_end_time").val();
				}else{
					req.endTime = today;
				}
				request.userReq = req;
				request.requestUser = true;
			}
			if(mtype == "group"){
				req = databus.builderObj("monitor", "monitor.MessageReqByRoom");
				req.roomIds = roomIds;
				req.count = -50;
				if($(".monitor-search" + "." + mtitle + "." + mtype).find(".monitor_start_time").val() != "") {
					req.startTime = $(".monitor-search" + "." + mtitle + "." + mtype).find(".monitor_start_time").val();
				}else{
					req.startTime = "";
				}

				if (lastSendTime != null) {
					req.lastSendTime = lastSendTime;
				}else{
					req.lastSendTime = mydate.getTime();
				}

				if($(".monitor-search" + "." + mtitle + "." + mtype).find(".monitor_end_time").val() != ""){
					req.endTime = $(".monitor-search" + "." + mtitle + "." + mtype).find(".monitor_end_time").val();
				}else{
					req.endTime = today;
				}
				req.userId = uId;
				req.isShowSelfCompany = isShowSelfCompany;
				req.allUserIds = UserIds;
				request.roomReq = req;
				request.requestUser = false;
			}
		},
		handleResponse : function(response) {
			$(".optbtn.export").show();
			$(".optspan.export").remove();
			if(response.result == 0){
				TINY.box.show({
					html: $("#popwin_exportExcel").html(),
					width: 300,
					fixed: false,
					maskid: 'blackmask',
					boxid: 'box_exportExcel',
					openjs: function () {
						var boxobj = $("#box_exportExcel");
						boxobj.find("a.linkurl").attr({"href":response.url,"target":"_blank"});
						boxobj.find(".popwin_cancel,.popwin_confirm").click(function(){
							TINY.box.hide();
						});

						$(".optbtn.export").removeAttr("disabled");
					}
				});
			}else{
				$('body').append('<div class="covercover"></div><div class="cover_content"><div class="cover_succeed"><span>没有查到聊天记录！</span></div></div>');
				//取消遮罩层
				$('.cover_content').delay(100).fadeOut(100, function() {
					$('.covercover').remove();
					$('.cover_content').remove();
				});
			}
		},
		handleOnDisconnect : function() {
			console.log("connection is disconnect");

			$(".coverIng span").text("连接已中断，请重新登录。");
			if(window.confirm("连接已中断，请点击确定重新登录。")) {
				databus.close();
				window.location.reload();
			}
		}
	});
}

function getImagePath() {
	var href = window.location.href;
	return href.substring(0, href.lastIndexOf("/")) + "/img/";
}

function requestMonitorUserChatEx(token, subid, topic, key, userId) {
	requestMonitorUserChatCommon(token, subid, topic, [ key ], [ userId ]);
}

function hashCode(str) {
	var hash = 0;
	if (str.length == 0)
		return hash;
	for (i = 0; i < str.length; i++) {
		char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

function createSubId(token, subid) {
	return hashCode(token) + subid;
}

function requestMonitorUserChatCommon(token, subid, topic, keys, userIds) {
	databus.requestOnce(COMMAND_SUBSCRIBE, "monitor", "monitor.SubscribeReq", "monitor.SubscribeRes", {
				fillRequest : function(request) {
					var subscribe = databus.builderObj("gateway", "Gateway.Subscribe");
					subscribe.token = token;

					var data = databus.builderObj("msgexpress", "MsgExpress.SubscribeData");
					data.subid = createSubId(token, subid);
					data.topic = topic;

					var items = [];
					for (var i = 0; i < keys.length; i++) {
						var key = keys[i];
						var userId = userIds[i];
						var item = databus.builderObj("msgexpress", "MsgExpress.DataItem");
						item.key = key;
						var DataType = databus.builderClass("msgexpress", "MsgExpress.DataType");
						item.type = DataType.UINT64;
						var values = [];
						for (var i = 0; i < userId.length; i++) {
							values.push(ByteBuffer.wrap(new ArrayBuffer(8),
									false).writeInt64(userId[i], 0));
						}
						item.value = values;
						items.push(item);
					}

					data.condition = items;
					subscribe.subdata = data.encode();

					request.monitorsb = subscribe;
				},
				handleResponse : function(response) {
					if(response.ret == 0){
						console.log("Subscribe succeed.");
					}
				},
				handleOnDisconnect : function() {
					console.log("connection is disconnect");

					$(".coverIng span").text("连接已中断，请重新登录。");
					if(window.confirm("连接已中断，请点击确定重新登录。")) {
						databus.close();
						window.location.reload();
					}
				}
			});
}

var showmsg = "";
function showMessage(msg) {
	console.log(msg);
}

// defination of scroll bar object
function ssScroll($ui) {
	var height = $ui[0].scrollHeight;
	return {
		height : function() {
			return height;
		},
		pullDown : function() {
			$ui.scrollTop(height);
		}
	};
}

function getCompanyName(companyId) {
	var company;
	if (company = allCompanys[companyId]) {
		return company.companyName;
	}
	return null;
}

function showCompanyName(companyId, nodeId) {
	var name = getCompanyName(companyId);
	if (name != null) {
		$("#" + nodeId).text(name);
		return;
	}
	var prefix = "company";
	if (!databus.contains(prefix + companyId)) {
		databus.requestOnce(COMMAND_REQUEST_COMPANY_INFO, "infoserver", "InfoServer.ISReqCompanyInfo", "InfoServer.ISResCompanyInfo", {
				fillRequest : function(info) {
					info.companyId = [ companyId ];
				},
				handleResponse : function(response) {
					//responseCompanyInfo(response);
					if (response.retcode != 0) {
						console.log("response company info error");
						return;
					}
					var company = response.companyInfo[0];
					databus.publishInfo("company", company.companyId, company);
				},
				handleOnDisconnect : function() {
					console.log("connection is disconnect");

					$(".coverIng span").text("连接已中断，请重新登录。");
					if(window.confirm("连接已中断，请点击确定重新登录。")) {
						databus.close();
						window.location.reload();
					}
				}
			});
	}
	databus.subscribeInfo(prefix, companyId, function(company) {
		// put company to cache
		if (!allCompanys[company.companyId]) {
			allCompanys[company.companyId] = company;
		}
		$("#" + nodeId).text(company.companyName);
	});
}

// escape character
function escapeChar(str) {
	return str.replace(/&|<|>/g, function($0) {
		var r = [ "&#" ];
		c = $0.charCodeAt(0);
		r.push(c);
		r.push(";");
		return r.join("");
	});
}

function getMsgType(body) {
	var msgType = "";
	var EMessageBodyType = databus.builderClass("QMClient",
			"QMClient.EMessageBodyType");
	if (body.type == EMessageBodyType.MSG_Body_Type_Emoticon
			|| body.type == EMessageBodyType.MSG_Body_Type_EnhancedEmoticon) {
		msgType = "emoji";
	} else if (body.type == EMessageBodyType.MSG_Body_Type_PIC) {
		msgType = "image";
	} else if (body.type == EMessageBodyType.MSG_Body_Type_File) {
		msgType = "file";
	} else if (body.type == EMessageBodyType.MSG_Body_Type_RoomCard) {
		msgType = "card";
	} else if (body.type == EMessageBodyType.MSG_Body_Type_QB_Contacts) {
		msgType = "text";
	} else if (body.type == EMessageBodyType.MSG_Body_Type_QB_QuoteMoney) {
		msgType = "quotemoney";
	} else if (body.type == EMessageBodyType.MSG_Body_Type_QB_QuoteBond) {
		msgType = "quotebond";
	} else if (body.type == EMessageBodyType.MSG_Body_Type_Purchase) {
		msgType = "purchase";
	}

	return msgType;
}

function getMsgContent(list) {
	var content = "", infoStr = "", textContent = "";
	var isSingleType = list.bodyList.length;
	var msgType = isSingleType === 1 ? getMsgType(list.bodyList[0]) : "text";
	var templateHeader = null;
	var templateType = null;
	var isSend = true;
	var EMessageBodyType = databus.builderClass("QMClient", "QMClient.EMessageBodyType");
	var MessageBodyList = databus.builderClass("QMClient", "QMClient.MessageBodyList");
	var TxtContent = databus.builderClass("QMClient", "QMClient.TxtContent");
	var FileSendInfo = databus.builderClass("QMClient", "QMClient.FileSendInfo");
	var RoomfileInfo = databus.builderClass("QMClient","QMClient.RoomfileInfo");
	var SysEmotionInfo = databus.builderClass("QMClient", "QMClient.SysEmotionInfo");
	var PicSendInfo = databus.builderClass("QMClient", "QMClient.PicSendInfo");
	var RoomCardInfo = databus.builderClass("QMClient", "QMClient.RoomCardInfo");
	var QuotationMoneyInfo = databus.builderClass("QMClient", "QMClient.QuotationMoneyInfo");
	var EQuotationOpType = databus.builderClass("QMClient", "QMClient.EQuotationOpType");
	var NewsShareBriefInfo = databus.builderClass("QMClient","QMClient.NewsShareBriefInfo");
	var FinancialNewsInfo = databus.builderClass("QMClient", "QMClient.FinancialNewsInfo");
	var QuotationBondInfo = databus.builderClass("QMClient", "QMClient.QuotationBondInfo");
	var PurchaseInfo = databus.builderClass("QMClient", "QMClient.PurchaseInfo");
	var ShareBondInfo = databus.builderClass("QMClient","QMClient.ShareBondInfo");
	var MarginalGuidance = databus.builderClass("QMClient","QMClient.MarginalGuidance");
	var BondsDelay = databus.builderClass("QMClient","QMClient.BondsDelay");
	var QuotedAlertInfo = databus.builderClass("QMClient","QMClient.QuotedAlertInfo");
	var QuotationBondBrief = databus.builderClass("QMClient","QMClient.QuotationBondBrief");
	for (var i = 0; i < isSingleType; i++) {
		var body = list.bodyList[i];
		if(body.msg.remaining() <= 0) {
			continue;
		}
		if (body.type == EMessageBodyType.MSG_Body_Type_TEXT) {
			var str = escapeChar(body.msg.toString("utf8"));
			infoStr += str;
			textContent += str; 
		} else if (body.type == EMessageBodyType.MSG_Body_Type_EnhancedTEXT) {
			var str = escapeChar(TxtContent.decode(body.msg).content
					.toString("utf8"));
			infoStr += str;
			textContent += str;
		} else if (body.type == EMessageBodyType.MSG_Body_Type_Emoticon) {
			var emojiName = body.msg.toString("utf8");
			infoStr += createEmojiHtml(emojiName);

		} else if (body.type == EMessageBodyType.MSG_Body_Type_EnhancedEmoticon) {
			infoStr += createEmojiHtml(SysEmotionInfo.decode(body.msg).emotion);

		} else if (body.type == EMessageBodyType.MSG_Body_Type_PIC) {
			var pic = PicSendInfo.decode(body.msg);
			//console.log("image uuid:" + pic.uuid);
			//if(!pic.uuid){debugger;}
			infoStr += "<img class=\"picture\" ";
			if (pic.uuid != null) {
				infoStr += "onclick=showPicture('" + pic.uuid + "')";
			}
			if(pic.content != null){
			infoStr += " src=\"" + "data:image/jpg;base64,"
					+ pic.content.toString("base64") + "\">";
			}
		} else if (body.type == EMessageBodyType.MSG_Body_Type_File) {
			var file = FileSendInfo.decode(body.msg);
			infoStr += "<div class=\"file-info\">"
					+ "<img class=\"file-icon\" src=\""
					+ createImageByFileName(file.fileName) + "\">"
					+ "<p class=\"file-name\">" + file.fileName + "</p>"
					+ "<p class=\"file-size\">"
					+ computeAttachSize(file.totalSize) + "</p>" + "</div>";
			infoStr += '<button type="button" onclick=getDownloadUrl("' + encodeURI(file.fileName) + '","' + file.totalSize + '","' + file.uuid + '")>下载</button>';
			textContent += file.fileName;
		} else if (body.type == EMessageBodyType.MSG_Body_Type_Shake
				|| body.type == EMessageBodyType.MSG_Body_Type_EnhancedShake) {
			if (isSend) {
				infoStr += "发送了一个窗口抖动";
			} else {
				infoStr += "收到了一个窗口抖动";
			}
		} else if (body.type == EMessageBodyType.MSG_Body_Type_RoomCard) {
			var card = RoomCardInfo.decode(body.msg);
			infoStr += "<div class=\"card-info\">"
					+ "<div class=\"card-title\">"
					+ card.roomName
					+ "</div>"
					+ "<div class=\"card-extra\"><div class=\"card-extra-item\">"
					+ "<label>群号</label><span class=\"card-code\">"
					+ card.alias
					+ "</span></div>"
					+ "<div class=\"card-extra-item\"><label>群主</label><span>"
					+ card.ownerName
					+ "</span></div><div class=\"clearB\"></div>"
					+ "<div class=\"card-extra-item\"><label>共</label><span>"
					+ card.totalNum
					+ " 人</span></div><div class=\"clearB\"></div>"
					+ "</div><div class=\"card-btn\"><span>申请入群</span></div></div>";
			textContent += (card.roomName+card.alias+card.ownerName+card.totalNum);
		} else if (body.type == EMessageBodyType.MSG_Body_Type_QB_QuoteMoney) {
			var quotation = QuotationMoneyInfo.decode(body.msg);
			if (i == 0) {
				templateHeader = BondTemplate[quotation.type];
				templateType = quotation.type;
				var title = "";
				if (templateType == EQuotationOpType.Quotation_Op_Pub) {
					title = "发布报价";
				} else if (templateType == EQuotationOpType.Quotation_Op_Cancel) {
					title = "撤销报价";
				} else if (templateType == EQuotationOpType.Quotation_Op_Rsp) {
					title = "回复报价";
					templateHeader = templateHeader.replace("{remark}", quotation.postScript);
				}
				templateHeader = templateHeader.replace("{headerTitle}", title);
				textContent += title;
			}
			var templateBody = BondDetailTemplate[quotation.type];
			var quotationTerm = undefined;
			templateBody = templateBody.replace("{operation}",getIconCSS(quotation.direct.display));
			templateBody = templateBody.replace("{bondAssets}",quotation.assetsType.display);
			if (quotation.term.length > 0) {
				templateBody = templateBody.replace("{bondTerm}",quotation.term[0].display);
				quotationTerm = quotation.term[0].display;
			} else {
				templateBody = templateBody.replace("{bondTerm}","");
				quotationTerm = "";
			}
				var qcount = "";
				if(quotation.count != null) {
					qcount = quotation.count.display
				}
				templateBody = templateBody.replace("{bondAmount}", qcount);

				var qprice = "";
				if(quotation.price != null) {
					qprice = quotation.price.display;
				}
				templateBody = templateBody.replace("{bondPrice}", quotation.price.display);

				textContent += (quotation.direct.display + quotation.assetsType.display + quotationTerm + qcount + quotation.price);
				var tagsHtml = "";
				if (quotation.tags != null) {
					var tagHtml = "";
					//tagsHtml = BondTagsTemplate[quotation.type].replace("{detailInfo}", quotation.memo);
					for (var a = 0; a < quotation.tags.length; a++) {
						tagHtml += BondTagTemplate[quotation.type].replace("{tag}", quotation.tags[a].display);
						textContent += quotation.tags[a].display;
					}

					tagsHtml = BondTagsTemplate[quotation.type].replace("{tagList}", tagHtml);
				}
				templateBody = templateBody.replace("{description}", tagsHtml);
				templateBody = templateBody.replace("{detailInfo}", quotation.memo);
				textContent += quotation.memo;
				infoStr += templateBody;

		} else if (body.type == EMessageBodyType.MSG_Body_Type_QB_QuoteConditions) {
			if (isSend) {
				infoStr += "发送了一条条件报价";
			} else {
				infoStr += "收到了一条条件报价";
			}

		}else if (body.type == EMessageBodyType.MSG_Body_Type_QB_QuoteBond) {
			if (isSend) {
				infoStr += "发送了一条债券报价";
			} else {
				infoStr += "收到了一条债券报价";
			}
		} else if (body.type == EMessageBodyType.MSG_Body_Type_Purchase) {
			var purchase = PurchaseInfo.decode(body.msg);
			infoStr += purchase.displayPre +"<span class='orange'>" + purchase.displayMain + "</span>";
			textContent += purchase.displayMain;

		} else if (body.type == EMessageBodyType.MSG_Body_Type_QB_Contacts) {
			if (isSend) {
				infoStr += "发送了一个联系人";
			} else {
				infoStr += "收到了一个联系人";
			}
		}else if (body.type == EMessageBodyType.MSG_Body_Type_FinancialNews) {
			var financeStr = FinancialNewsInfo.decode(body.msg);
			infoStr += financeStr.content.toString("utf8");
			textContent += financeStr.content.toString("utf8");
		}else if (body.type == EMessageBodyType.MSG_Body_Type_OrganizationNotice) {
			var noteMsgStr = escapeChar(TxtContent.decode(body.msg).content.toString("utf8"));
			infoStr += "【机构通知】" + noteMsgStr;
			textContent += noteMsgStr;
		}else if (body.type == EMessageBodyType.MSG_Body_Type_NEWBONDPUSH) {
			var noteMsgStr = "今日新券：" + escapeChar(body.msg.toString("utf8"));
			infoStr += noteMsgStr;
			textContent += noteMsgStr;
		}else if (body.type == EMessageBodyType.MSG_Body_Type_BONDTXT) {
			var infoMsgStr = escapeChar(TxtContent.decode(body.msg).content.toString("utf8"));
			infoStr += infoMsgStr;
			textContent += infoMsgStr;
		}else if (body.type == EMessageBodyType.MSG_Body_Type_News) {
			var news_title = body.basiccontent;
			var news_msg = NewsShareBriefInfo.decode(body.msg);

			infoStr += "【新闻】" + '<a href="' + news_msg.webUrl + '" target="_blank">' + news_title + '</a>';
			//textContent += news_msg.webUrl;
		}else if(body.type == EMessageBodyType.MSG_body_Type_RoomFile){
			var file = RoomfileInfo.decode(body.msg);
			infoStr += "<div class=\"file-info\">"
				+ "<img class=\"file-icon\" src=\""
				+ createImageByFileName(file.fileName) + "\">"
				+ "<p class=\"file-name\">" + file.fileName + "</p>"
				+ "<p class=\"file-size\">"
				+ computeAttachSize(file.totalSize) + "</p>" + "</div>";
			infoStr += '<button type="button" onclick=getDownloadUrl("' + encodeURI(file.fileName) + '","' + file.totalSize + '","' + file.fuuid + '")>下载</button>';
			textContent += file.fileName;
		}else if(body.type == EMessageBodyType.MSG_Body_Type_ShareBond){
			var SBinfo = ShareBondInfo.decode(body.msg);
			infoStr += SBinfo.BondCode + SBinfo.BondShortName + SBinfo.Memo;
		}else if(body.type == EMessageBodyType.MSG_Body_Type_MarginalGuidance){
			var MGinfo = MarginalGuidance.decode(body.msg);
			infoStr += MGinfo.bondinfo.bondShowname + MGinfo.remark;
		}else if(body.type == EMessageBodyType.MSG_Body_Type_BondsDelay){
			var BDinfo = BondsDelay.decode(body.msg);
			infoStr += "您申购的<u>" + BDinfo.bondinfo.bondShowname + "</u>已推迟发行，望知悉。";
		}else if(body.type == EMessageBodyType.MSG_Body_Type_Quoted_Alert){
			var QAinfo = QuotedAlertInfo.decode(body.msg);
			infoStr += QAinfo.companyName + "-" + QAinfo.username + "发来一条报价：" + QAinfo.content;
		}
	}
	if (templateHeader != null) {
		templateHeader = templateHeader.replace("{itemList}", infoStr);
		content += "<span class=\"msg-content\" type=\"" + msgType + "\">"
				+ templateHeader + "</span>";
	} else {
		content += "<span class=\"msg-content\" type=\"" + msgType + "\">"
				+ infoStr + "</span>";
	}

	return {
		content:content,
		textContent:textContent
	};
}

function getDownloadUrl(filename,totalsize,uuid) {
	var contents = uuid.split("_");
	var realUuid = contents[0];
	var year = contents[1].substring(0, 4);
	var date = contents[1].substring(4, contents[1].length);
	var url = "";

	databus.requestOnce(COMMAND_GET_FILE_UPLOADSIZE, "fileserver", "FileServer.FSReqFileUploadSize", "FileServer.FSResFileUploadSize", {
		fillRequest: function (request) {
			request.uuid = uuid;
		},
		handleResponse: function (response) {
			if(response.retcode == 0){
				var uploadsize = response.uploadsize;
				if(uploadsize == totalsize){
					url = locationurl+"download?name=" + filename + "&url="+renamelocation + "/" + year + "/" + date + "/" + realUuid;
				}
			}
			if(url == ""){
				TINY.box.show({
					html: $("#popwin_error").html(),
					width: 400,
					fixed: false,
					maskid: 'blackmask',
					boxid: 'box_error',
					openjs: function () {
						$("#box_error").find(".popwin_cancel").click(function(){
							TINY.box.hide();
						});
					}
				})
			}else {
				window.frames["downframe"].location.href = url;
			}
		},
		handleOnDisconnect : function() {
			console.log("connection is disconnect");

			$(".coverIng span").text("连接已中断，请重新登录。");
			if(window.confirm("连接已中断，请点击确定重新登录。")) {
				databus.close();
				window.location.reload();
			}
		}
	});
}

var box;

function showPicture(uuid) {
	if(uuid == ""){return;}
	var contents = uuid.split("_");
	var realUuid = contents[0];
	var year = contents[1].substring(0, 4);
	var date = contents[1].substring(4, contents[1].length);
	var img = "<img class=\"lazy\" data-original=\""+pictureLocation
			+ "/" + year + "/" + date + "/" + realUuid + "\">";
	box = TINY.box;
	box.show({
		html : img,
		fixed: false,
		maskid: 'blackmask',
		boxid : 'box_img',
		openjs : function() {
			$("img.lazy").show().lazyload({
				load : function() {
					resizeBox();
				}
			});
			$("#box_img,.tmask").click(function() {
				box.hide();
			});
		}
	});
}

function resizeBox() {
	box.size($("img.lazy").width(), $("img.lazy").height());
}
Date.prototype.format = function(format) {
	var o = {
		"M+": this.getMonth() + 1,
		// month
		"d+": this.getDate(),
		// day
		"h+": this.getHours(),
		// hour
		"m+": this.getMinutes(),
		// minute
		"s+": this.getSeconds(),
		// second
		"q+": Math.floor((this.getMonth() + 3) / 3),
		// quarter
		"S": this.getMilliseconds()
		// millisecond
	};
	if (/(y+)/.test(format) || /(Y+)/.test(format)) {
		format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	for (var k in o) {
		if (new RegExp("(" + k + ")").test(format)) {
			format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
		}
	}
	return format;
};

function timestampformat(timestamp) {
	return (new Date(timestamp * 1000)).format("yyyy-MM-dd hh:mm:ss");
}

function GetCurrentTime() {
	var curTime = new Date();
	return curTime.format('yyyy-MM-dd h:m:s');
}

function isEmpty(obj) {
	return obj == undefined || obj == null;
}

function encode(s){
	return s.replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">").replace(/([\\\.\*\[\]\(\)\$\^])/g,"\\$1");
}
function decode(s){
	return s.replace(/\\([\\\.\*\[\]\(\)\$\^])/g,"$1").replace(/>/g,">").replace(/</g,"<").replace(/&/g,"&");
}

function highlight(){
	var schV = getStrTrim($("#keyword").val());
	if(schV == ""){return;}
	s=encode(schV);
	var obj = "";
	var cnt = 0;
	var mtag = $(".monitor-message-list.history"+"." + mtype);
	mtag.find("li.list-message .msg-content").each(function(){
		obj = $(this)[0];
		var t=obj.innerHTML.replace(/<span\s+class=.?highlight.?>([^<>]*)<\/span>/gi,"$1");
		obj.innerHTML=t;
		cnt += loopSearch(s,obj);
		t=obj.innerHTML;
		var r=/{searchHL}(({(?!\/searchHL})|[^{])*){\/searchHL}/g;
		t=t.replace(r,"<span class='highlight'>$1</span>");
		obj.innerHTML=t;

	});

	if(schV != ""){
		if(cnt == 0){
			$("#result").html('未查到匹配的聊天记录');
		}else {
			$("#result").html('共查到相关的词<span class="red">' + cnt + '</span>处');
		}
	}

	mtag.find("li").hide();
	$(".highlight").each(function(i){
		$(this).closest("li").show();
	});
}
function loopSearch(s,obj){
	var cnt=0;
	if (obj.nodeType==3){
		cnt=replace(s,obj);
		return cnt;
	}
	for (var i=0,c;c=obj.childNodes[i];i++){
		if (!c.className||c.className!="highlight")
			cnt+=loopSearch(s,c);
	}
	return cnt;
}
function replace(s,dest){
	var r=new RegExp(s,"g");
	var tm=null;
	var t=dest.nodeValue;
	var cnt=0;
	if (tm=t.match(r)){
		cnt=tm.length;
		t=t.replace(r,"{searchHL}"+decode(s)+"{/searchHL}");
		dest.nodeValue=t;
	}
	return cnt;
}
var ProtoBuf = dcodeIO.ProtoBuf;
var ByteBuffer = dcodeIO.ByteBuffer;
var Long = dcodeIO.Long;

var serial = 65536;
var token;
var username;
var userid, companyid, accountId;
var ws;
var allUsers = [];
var allUserIds = [];
var allCompanys = [];
var allGroups = [];

var APPID = 0x00B;
var KEY_SM_SERVER_ID = 1;
var KEY_SM_USER_ID = 2;

var KEY_NOTIFY_NAME = 3; // Message name
var KEY_NOTIFY_CONTENT = 4; // Message content

var KEY_CLIENT_FROM_ID = 5; // For subscribe
var KEY_CLIENT_TO_ID = 6; // For subscribe

var KEY_CLIENT_MSG = 7; // SMMessage
var KEY_CLIENT_PRESENCE = 8; // SMPresence

var TOPIC_SM = ((APPID << 20) | 0x00001);// for SM.
var TOPIC_CLIENT_MSG = ((APPID << 20) | 0x00002);// KEY_CLIENT_MSG
var TOPIC_CLIENT_PRESENCE = ((APPID << 20) | 0x00003);// KEY_CLIENT_PRESENCE
var TOPIC_CLIENT_ROOM_MSG = ((APPID << 20) | 0x00004);// KEY_CLIENT_MSG,
var TOPIC_CLIENT_ROOM_PRESENCE = ((APPID << 20) | 0x00005);// KEY_CLIENT_PRESENCE
var TOPIC_CLIENT_NOTIFY = ((APPID << 20) | 0x00006);// KEY_NOTIFY_NAME,KEY_NOTIFY_CONTENT
var TOPIC_SYSTEM_NOTIFY = ((APPID << 20) | 0x00007);// KEY_NOTIFY_NAME,KEY_NOTIFY_CONTENT

var COMMAND_GATEWAY_LOGIN = (1 << 20) | 1;
var COMMAND_ACCOUNT_LOGIN = (500 << 20) | 4;
var COMMAND_SUBSCRIBE = (500 << 20) | 5;
var COMMAND_REQUEST_ALL_USER = (500 << 20) | 6;
var COMMAND_REQUEST_MESSAGE = (500 << 20) | 7;
var COMMAND_REQUEST_USER = (64 << 20) | 1;
var COMMAND_REQUEST_ROOM = (64 << 20) | 22;
var COMMAND_MODIFY_PASSWORD = (5 << 20) | 24;
var COMMAND_REQUEST_COMPANY_INFO = (64 << 20) | 17;

var wsip = "172.16.17.178";
var wsport = "8080";
var pictureip = "172.16.17.178";
var pictureport = "8080";
var wsLocation = wsip + ":" + wsport;
var path = "/Gateway/SocketServer";
var pictureLocation = pictureip + ":" + pictureport;

var databus = new $.fn.Databus();

$(function() {
	$(".monitor-operate").delegate(".monitor-radio", "click",function() {
		handleOnMonitorRadioClick();
	});

	$(".monitor-member-list").delegate("li", "click", function() {
		selectUser();
	});

	$(".login-form").delegate(".login-form-button.clickable", "click",function() {
		var username = $("#username_input").val();
		var password = $("#password_input").val();
		if (username == "" || password == "") {
			return;
		}
		startWebSocket(username, password);
	});
});

function subscribeUserInfo(userId, callback) {
	databus.subscribeInfo("", userId, callback);
}

function publishUserInfo(userDetail) {
	databus.publishInfo("", userDetail.userInfo.userID, userDetail);
}

var from;
var to;

function isShowMsg(userId1, userId2) {
	console.log("userId1:" + userId1 + ",userId2:" + userId2);
	var flag = false;
	var containsOne = false;
	if (typeof (from) == "string") {
		containsOne = true;
		flag |= (userId1 == from || userId2 == from);
	}
	if (!flag && typeof (to) == "string") {
		containsOne = true;
		flag |= (userId1 == to || userId2 == to);
	}

	if (flag)
		return true;
	if (containsOne)
		return false;
	return true;
}

function isInCollection(userid, collection) {
	if (typeof (collection) == "string") {
		return userid == collection;
	}
	return getUser(userid);
}

function handleOnMonitorRadioClick() {
	if ($(".monitor-operate-all").hasClass("checked")) {
		from = to = allUsers;
	} else {
		selectUser();
	}
	$("#monitor-message-list").empty();

	if ($(".monitor-head-history").hasClass("active")) {
		// request history
		requestMessage(null);
	}
}



function selectUser() {
	var firstUserId = $("#input_first").attr("userid");
	if (typeof (firstUserId) == "undefined" || firstUserId == "")
		return;
	var secondUserId = $("#input_second").attr("userid");
	if (typeof (secondUserId) == "undefined" || secondUserId == "") {
		from = firstUserId;
		to = allUsers;
	} else {
		from = firstUserId;
		to = secondUserId;
	}
}

function parsePublishData(topic, jsonContent) {
	if (topic == TOPIC_CLIENT_MSG || topic == TOPIC_CLIENT_ROOM_MSG) {
		if (!($(".monitor-head-real").hasClass("active"))) {
			return;
		}
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

var messageId = 0;

function dispatchPublishSMMessageEx(toId, fromId, msg, isroom, append) {

	if (fromId == null) {
		fromId = msg.header.from;
	}
	if (toId == null) {
		toId = msg.to[0];
	}
	var toUser = getUser(toId);
	var fromUser = getUser(fromId);
	if (toUser == null && fromUser == null)
		return;
	if (!isShowMsg(toId.toString(), fromId.toString()))
		return;

	var bodyList = databus.builderClass("QMClient", "QMClient.MessageBodyList")
			.decode(msg.body);
	var content = getMsgContent(bodyList);

	messageId++;
	var fromName = "未知";
	var fromCompanyName = null;
	var nameNode, companyNode, requestUserId = null;
	if (fromUser != null) {
		fromName = fromUser.userInfo.name;
		if ((fromCompanyName = getCompanyName(fromUser.userInfo.companyId)) == null) {
			showCompanyName(fromUser.userInfo.companyId, "fromCompanyName"
					+ messageId);
		}
	} else {
		nameNode = "fromName" + messageId;
		companyNode = "fromCompanyName" + messageId;
		requestUserId = fromId;
	}
	var toName = "未知";
	var toCompanyName = null;
	if (toUser != null) {
		toName = toUser.userInfo.name;
		if ((toCompanyName = getCompanyName(toUser.userInfo.companyId)) == null) {
			showCompanyName(toUser.userInfo.companyId, "toCompanyName"
					+ messageId);
		}
	} else {
		nameNode = "toName" + messageId;
		companyNode = "toCompanyName" + messageId;
		requestUserId = toId;
	}
	// now request user
	if (requestUserId != null) {
		if (!isroom) {
			// subscribe
			subscribeUserInfo(requestUserId, function(userDetail) {
				$("#" + nameNode).text(userDetail.userInfo.name);
				// show company name
				showCompanyName(userDetail.userInfo.companyId, companyNode);
			});
			requestUserInfo(requestUserId);
		} else {
			var roomId = requestUserId;
			databus.subscribeInfo("room", roomId, function(roomInfo) {
				$("#" + nameNode).text(roomInfo.name);
			});
			requestRoomInfo(fromId, roomId);
		}
	}
	var date = new Date();
	date.setTime(msg.time.toString());

	var html = "<li msgId=" + messageId + " seqId=" + msg.id
			+ " class=\"list-message\">"
			+ "<p class=\"msg-title\"><span id=\"fromName" + messageId + "\">"
			+ fromName + "</span> - <span id=\"fromCompanyName" + messageId
			+ "\">" + (fromCompanyName == null ? "" : fromCompanyName)
			+ "</span>";
	if (isroom) {
		html += " 在  <span id=\"toName" + messageId + "\">" + toName
				+ "</span>";
	} else {
		html += " 对 <span id=\"toName" + messageId + "\">" + toName
				+ "</span>- <span id=\"toCompanyName" + messageId + "\">"
				+ (toCompanyName == null ? "" : toCompanyName) + "</span>";
	}
	html += "</p>"
			+ content
			+ "<span class=\"msg-time\">"
			+ (date.isSameDay() ? date.Format("hh:mm:ss") : date
					.Format("yyyy-MM-dd hh:mm:ss")) + "</span></li>";
	var tag;
	if ($(".monitor-head-history").hasClass("active")) {
		tag = $("#monitor-history-message-list");
		tag.prepend(html).getNiceScroll().resize();
	} else {
		tag = $("#monitor-message-list");
		tag.append(html).getNiceScroll().resize();
		ssScroll(tag).pullDown();
		
		var $list = tag.find("li");
		if ($list.length > 100)
			$list.eq(0).remove();
	}

}

function dispatchPublishSMMessage(toId, fromId, msg, isroom) {
	dispatchPublishSMMessageEx(toId, fromId, msg, isroom, true);
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

function getUser(userId) {
	var user = null;
	for (var i = 0; i < allUsers.length; i++) {
		if (allUsers[i].userInfo.userID.equals(userId)) {
			user = allUsers[i];
			break;
		}
	}
	return user;
}

function requestMessage(sequenceId) {
	databus.requestOnce(COMMAND_REQUEST_MESSAGE, "monitor",
			"monitor.MessageReq", "monitor.MessageRes", {
			fillRequest : function(request) {
					request.token = token;
					request.useridStart = parseInt(from);
					request.useridEnd = parseInt(to);
					if (sequenceId != null) {
						request.sequenceId = sequenceId;
					}
					request.count = -40;
					request.startTime = $("#monitor_start_time").val();
					request.endTime = $("#monitor_end_time").val();
				},
				handleResponse : function(response) {
					responseMessage(response);
				}
			});
}

function responseMessage(res) {
	var before = ssScroll($("#monitor-history-message-list")).height();
	for (var i = res.messages.length - 1; i >= 0; i--) {
		dispatchPublishSMMessageEx(null, null, res.messages[i], false);
	}
	var after = ssScroll($("#monitor-history-message-list")).height();
	var scrollTop = after - before;
	$("#monitor-history-message-list").scrollTop(scrollTop);
}

function requestAllUser(companyid) {
	databus.requestOnce(COMMAND_REQUEST_ALL_USER, "monitor",
			"monitor.AllUserInfoReq", "monitor.ALLUserInfoRes", {
				fillRequest : function(request) {
					request.companyid = companyid;
					request.token = token;
				},
				handleResponse : function(response) {
					responseAllUser(response);
				}
			});
}

function responseAllUser(response) {
	showMessage("response all user retcode:" + response.errorCode);
	if (response.errorCode != 0)
		return;
	var content = "";
	for (var i = 0; i < response.userInfo.length; i++) {
		allUsers.push(response.userInfo[i]);
		var name = response.userInfo[i].userInfo.name;
		var userid = response.userInfo[i].userInfo.userID;
		var description = response.userInfo[i].status;
		allUserIds.push(userid);
		var image;
		if (response.userInfo[i].userInfo.avatarId < 10000) {
			image = getImagePath() + "person_36.png";
		} else {
			var buffer = response.userInfo[i].userInfo.avatar;
			image = "data:image/jpg;base64," + buffer.toString("base64");
		}
		content += "<li  userid=" + userid + " class=\"list-person\">"
				+ "<img class=\"person-head\" src=\"" + image + "\">"
				+ "<span class=\"person-name\">" + escapeChar(name) + "</span>"
				+ "<span class=\"person-remark\">" + escapeChar(description)
				+ "</span>" + "</li>";
	}
	from = to = allUsers;
	$("#monitor-member-list").append(content).getNiceScroll().resize();
	requestMonitorAllUserChat(token, allUserIds);
}

function requestRoomInfo(userid, roomid) {
	databus.requestOnce(COMMAND_REQUEST_ROOM, "infoserver",
			"InfoServer.ISReqUserRoomInfo", "InfoServer.ISResUserRoomInfo", {
				fillRequest : function(info) {
					info.userId = userid;
					info.roomId = [ roomid ];
					info.version = [ 0 ];
					info.reqMember = false;
					info.reqOwner = false;
				},
				handleResponse : function(response) {
					responseRoomInfo(response);
				}
			});
}

function responseRoomInfo(res) {
	var roomInfo = res.roomInfo[0];
	databus.publishInfo("room", roomInfo.ID, roomInfo);
}

function requestUserInfo(userid) {
	databus.requestOnce(COMMAND_REQUEST_USER, "infoserver",
			"InfoServer.ISReqUserInfo", "InfoServer.ISResUserInfo", {
				fillRequest : function(info) {
					info.ownerId = 0;
					info.detail = true;
					info.version = [ 0 ];
					info.userId = [ userid ];
				},
				handleResponse : function(response) {
					responseUserInfo(response);
				}
			});
}

function responseUserInfo(res) {
	var user = res.userInfo[0];
	publishUserInfo(user);
}

function requestModifyPassword(old, now) {
	databus.requestOnce(COMMAND_MODIFY_PASSWORD, "accountserver",
			"AccountServer.ReqUpdateMonitor", "AccountServer.ResUpdateMonitor",
			{
				fillRequest : function(info) {
					info.accountId = accountId;
					info.companyId = companyid;
					info.oldPassword = hex_md5(old);
					info.newPassword = hex_md5(now);
				},
				handleResponse : function(response) {
					responseModifyPassword(response);
				}
			});
}

function responseModifyPassword(res) {
	var result = res.result;
	if (result == 0) { // SUCCESS
		console.log("success modify password");
	}
}

function getImagePath() {
	var href = window.location.href;
	return href.substring(0, href.lastIndexOf("/")) + "/img/";
}

var SUBID_FROM = 0;
var SUBID_TO = 1;
var SUBID_ROOM_FROM = 2;

function requestMonitorAllUserChat(token, userIds) {
	databus.requestPublishData(TOPIC_CLIENT_MSG, dispatchPublishSMMessage);
	databus.requestPublishData(TOPIC_CLIENT_ROOM_MSG, dispatchPublishSMMessage);
	// send subscribe
	requestMonitorUserChatEx(token, SUBID_TO, TOPIC_CLIENT_MSG,
			KEY_CLIENT_TO_ID, userIds);
	requestMonitorUserChatEx(token, SUBID_FROM, TOPIC_CLIENT_MSG,
			KEY_CLIENT_FROM_ID, userIds);
	requestMonitorUserChatEx(token, SUBID_ROOM_FROM, TOPIC_CLIENT_ROOM_MSG,
			KEY_CLIENT_FROM_ID, userIds);
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
	databus.requestOnce(COMMAND_SUBSCRIBE, "monitor", "monitor.SubscribeReq",
			"monitor.SubscribeRes", {
				fillRequest : function(request) {
					var subscribe = databus.builderObj("gateway",
							"Gateway.Subscribe");
					subscribe.token = token;

					var data = databus.builderObj("msgexpress",
							"MsgExpress.SubscribeData");
					data.subid = createSubId(token, subid);
					data.topic = topic;

					var items = [];
					for (var i = 0; i < keys.length; i++) {
						var key = keys[i];
						var userId = userIds[i];
						var item = databus.builderObj("msgexpress",
								"MsgExpress.DataItem");
						item.key = key;
						var DataType = databus.builderClass("msgexpress",
								"MsgExpress.DataType");
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
				}
			});
}

function login(username, password) {
	databus.requestOnce(COMMAND_ACCOUNT_LOGIN, "monitor", "monitor.AccountReq",
			"monitor.AccountRes", {
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
						console.log("login success,token=" + token + ", id:" + accountId);
						gatewaylogin();
					} else {
						console.log(response.error_desc);
					}
				}
			});
}

function gatewaylogin() {
	databus.requestOnce(COMMAND_GATEWAY_LOGIN, "gateway", "Gateway.Login", "Gateway.CommonResponse", {
		fillRequest : function(request) {
			request.token = token;
		},
		handleResponse : function(response) {
			if (response.retcode == 0) {
				showMessage("Gateway login success");
				onLoginSuccess();
			}
		}
	});
}

function onLoginSuccess() {
	$("#login_panel").css("display", "none");
	$("#monitor_panel").css("display", "");
	requestAllUser(companyid);
}

function sendmsg(cmd, msg) {
	var data = msg.encode();
	var pack = new Pack();
	pack.body = data;
	pack.header = new Header();
	pack.header.packageType = 1;
	pack.header.serialnum = serial++;
	pack.header.command = cmd;
	var bb = pack.encode();
	if (ws.readyState == WebSocket.OPEN)
		ws.send(bb.toArrayBuffer());
}
function startWebSocket(username, password) {
	//databus.connect(wsip, wsport, path);
	databus.connect(wsip, wsport, path, {
		onConnectSuccess: function(){
			login(username, password);
		}
	});
	databus.setPushDataFactory(function(topic, jsonContent) {
		parsePublishData(topic, jsonContent);
	});
}
var showmsg = "";
function showMessage(msg) {
	// showmsg = showmsg + "<tr><td>" + msg + "</td></tr>";
	// $("#receivemsg2").html(showmsg);
	console.log(msg);
}

function handleData(data) {
	var vals = data.split("\t");
	var msgType = vals[0];
	switch (msgType) {
	case "NAME":
		var msg = vals[1];
		var mes = "NAME" + "\t" + msg + "_" + username;
		send(mes);
		break;
	case "MSG":
		var val2s = vals[1].split("_");
		var from = val2s[0];
		var message = val2s[2];
		// alert(from+":"+message);
		var str = $("#receivemsg2").html();

		showmsg = showmsg + "<tr><td>" + from + ":" + message + "</td></tr>";
		$("#receivemsg2").html(showmsg);
		break;
	default:
		showmsg = showmsg + "<tr><td>" + msgType + "</td></tr>";
		$("#receivemsg2").html(showmsg);
		break;

	}
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

function requestCompanyInfo(companyId) {
	databus.requestOnce(COMMAND_REQUEST_COMPANY_INFO, "infoserver",
			"InfoServer.ISReqCompanyInfo", "InfoServer.ISResCompanyInfo", {
				fillRequest : function(info) {
					info.companyId = [ companyId ];
				},
				handleResponse : function(response) {
					responseCompanyInfo(response);
				}
			});
}

function responseCompanyInfo(res) {
	if (res.retcode != 0) {
		console.log("response company info error");
		return;
	}
	var company = res.companyInfo[0];
	databus.publishInfo("company", company.companyId, company);
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
		requestCompanyInfo(companyId);
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
	}

	return msgType;
}

function getMsgContent(list) {
	var content = "", infoStr = "";
	var isSingleType = list.bodyList.length;
	var msgType = isSingleType === 1 ? getMsgType(list.bodyList[0]) : "text";
	var templateHeader = null;
	var templateType = null;
	var isSend = true;
	var EMessageBodyType = databus.builderClass("QMClient",
			"QMClient.EMessageBodyType");
	var MessageBodyList = databus.builderClass("QMClient",
			"QMClient.MessageBodyList");
	var TxtContent = databus.builderClass("QMClient", "QMClient.TxtContent");
	var FileSendInfo = databus
			.builderClass("QMClient", "QMClient.FileSendInfo");
	var SysEmotionInfo = databus.builderClass("QMClient",
			"QMClient.SysEmotionInfo");
	var PicSendInfo = databus.builderClass("QMClient", "QMClient.PicSendInfo");
	var RoomCardInfo = databus
			.builderClass("QMClient", "QMClient.RoomCardInfo");
	var QuotationMoneyInfo = databus.builderClass("QMClient",
			"QMClient.QuotationMoneyInfo");
	var EQuotationOpType = databus.builderClass("QMClient",
			"QMClient.EQuotationOpType");
	for (var i = 0; i < isSingleType; i++) {
		var body = list.bodyList[i];
		if (body.type == EMessageBodyType.MSG_Body_Type_TEXT) {
			infoStr += escapeChar(body.msg.toString("utf8"));

		} else if (body.type == EMessageBodyType.MSG_Body_Type_EnhancedTEXT) {
			infoStr += escapeChar(TxtContent.decode(body.msg).content
					.toString("utf8"));

		} else if (body.type == EMessageBodyType.MSG_Body_Type_Emoticon) {
			var emojiName = body.msg.toString("utf8");
			infoStr += createEmojiHtml(emojiName);

		} else if (body.type == EMessageBodyType.MSG_Body_Type_EnhancedEmoticon) {
			infoStr += createEmojiHtml(SysEmotionInfo.decode(body.msg).emotion);

		} else if (body.type == EMessageBodyType.MSG_Body_Type_PIC) {
			var pic = PicSendInfo.decode(body.msg);
			console.log("image uuid:" + pic.uuid);
			infoStr += "<img class=\"picture\" ";
			if (pic.uuid != null) {
				// infoStr += "onclick=showPicture("+pic.uuid+")";
				infoStr += "onclick=showPicture('" + pic.uuid + "')";
			}
			infoStr += " src=\"" + "data:image/jpg;base64,"
					+ pic.content.toString("base64") + "\">";

		} else if (body.type == EMessageBodyType.MSG_Body_Type_File) {
			var file = FileSendInfo.decode(body.msg);
			infoStr += "<div class=\"file-info\">"
					+ "<img class=\"file-icon\" src=\""
					+ createImageByFileName(file.fileName) + "\">"
					+ "<p class=\"file-name\">" + file.fileName + "</p>"
					+ "<p class=\"file-size\">"
					+ computeAttachSize(file.totalSize) + "</p>" + "</div>";
			infoStr += "<span><a href=\""
					+ getDownloadUrl(file.uuid)
					+ "\" target=\"_blank\ class=\"download_file\">下载</a></span>";

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
					templateHeader = templateHeader.replace("{remark}",
							quotation.postScript);
				}
				templateHeader = templateHeader.replace("{headerTitle}", title);
			}
			var templateBody = BondDetailTemplate[quotation.type];
			templateBody = templateBody.replace("{operation}",
					getIconCSS(quotation.direct.display));
			templateBody = templateBody.replace("{bondAssets}",
					quotation.assetsType.display);
			templateBody = templateBody.replace("{bondTerm}",
					quotation.term[0].display);
			templateBody = templateBody.replace("{bondAmount}",
					quotation.count.display);
			templateBody = templateBody.replace("{bondPrice}", quotation.price);
			var tagsHtml = "";
			if (quotation.tags != null) {
				var tagHtml = "";
				for (var i = 0; i < quotation.tags.length; i++) {
					tagHtml += BondTagTemplate[quotation.type].replace("{tag}",
							quotation.tags[i].display);
				}

				tagsHtml = BondTagsTemplate[quotation.type].replace(
						"{tagList}", tagHtml);
			}
			templateBody = templateBody.replace("{description}", tagsHtml
					+ quotation.memo);
			infoStr += templateBody;

		} else if (body.type == EMessageBodyType.MSG_Body_Type_QB_QuoteConditions) {
			if (isSend) {
				infoStr += "发送了一条条件报价";
			} else {
				infoStr += "收到了一条条件报价";
			}

		} else if (body.type == EMessageBodyType.MSG_Body_Type_QB_QuoteBond) {
			if (isSend) {
				infoStr += "发送了一条债券报价";
			} else {
				infoStr += "收到了一条债券报价";
			}
		} else if (body.type == EMessageBodyType.MSG_Body_Type_QB_Contacts) {
			if (isSend) {
				infoStr += "发送了一个联系人";
			} else {
				infoStr += "收到了一个联系人";
			}
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

	return content;
}

function getDownloadUrl(uuid) {
	var contents = uuid.split("_");
	var realUuid = contents[0];
	var year = contents[1].substring(0, 4);
	var date = contents[1].substring(4, contents[1].length);
	return "http://" + pictureLocation + "/" + year + "/" + date + "/"
			+ realUuid;
}

var box;

function showPicture(uuid) {
	var contents = uuid.split("_");
	var realUuid = contents[0];
	var year = contents[1].substring(0, 4);
	var date = contents[1].substring(4, contents[1].length);
	var img = "<img class=\"lazy\" data-original=\"http://" + pictureLocation
			+ "/" + year + "/" + date + "/" + realUuid + "\">";
	box = TINY.box;
	box.show({
		html : img,
		boxid : 'box_img',
		openjs : function() {
			$("img.lazy").show().lazyload({
				load : function() {
					resizeBox();
				}
			});
			$("#box_img").click(function() {
				box.hide();
			});
		}
	});
}

function resizeBox() {
	box.size($("img.lazy").width(), $("img.lazy").height());
}

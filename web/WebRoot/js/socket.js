var ProtoBuf = dcodeIO.ProtoBuf;
var ByteBuffer = dcodeIO.ByteBuffer;
var builder = ProtoBuf.loadProtoFile("protobuf/msgexpress.proto");
var builder2 = ProtoBuf.loadProtoFile("protobuf/accountserver.proto");
var builder3 = ProtoBuf.loadProtoFile("protobuf/gateway.proto");
var builder4 = ProtoBuf.loadProtoFile("protobuf/monitor.proto");
var builder5 = ProtoBuf.loadProtoFile("protobuf/infoserver.proto");
var builder6 = ProtoBuf.loadProtoFile("protobuf/qmppsm.proto");

var ErrMsg = builder.build("MsgExpress.ErrMessage");
var PublishMsg = builder.build("MsgExpress.PublishData");
var Pack = builder.build("MsgExpress.Pack");
var Header = builder.build("MsgExpress.Header");
var DataType = builder.build("MsgExpress.DataType");

var ReqLogin = builder2.build("AccountServer.ReqNewLogin");
var ResLogin = builder2.build("AccountServer.ResNewLogin");

var GatewayLogin = builder3.build("Gateway.Login");
var GatewayResp = builder3.build("Gateway.CommonResponse");

var ISReqRosterInfo = builder5.build("InfoServer.ISReqRosterInfo");
var ISResRosterInfo = builder5.build("InfoServer.ISResRosterInfo");

var Hello = builder4.build("monitor.Hello");

var serial = 65536;
var token;
var username;
var userid;
var ws;

$(document).ready(function() {

	$("#sendbutton").attr("disabled", false);
	$("#sendbutton").click(sendMessage);

	$("#testbutton").attr("disabled", false);
	$("#testbutton").click(test);

	startWebSocket();
})
function test() {
	var hello = new Hello();
	hello.str = "你妹的";
	sendmsg(((500 << 20) | 2), hello);
}

function sendMessage() {
	var username = $("#username").val();
	var password = $("#password").val();
	login(username, password);
}

function requestAllUser(userId) {
	var info = new ISReqRosterInfo();
	info.userId = userId;
	info.version = 0;
	sendmsg(((64 << 20) | 3), info);
}

function responseAllUser(response){
	showMessage("response all user retcode:"+response.retcode);
	if(response.retcode != 0 )
		return;
	var content = [];
	for (var i = 0; i < response.userUpdate.length; i++) {
		var name = response.userUpdate[i].userDetailInfo.userInfo.name;
		content.push({
			name : name
		});
		showMessage("name:"+ name);
	}
}

function login(username, password) {
	var reqlogin = new ReqLogin();
	reqlogin.loginName = username;
	reqlogin.password = hex_md5(password);
	sendmsg(((5 << 20) | 8), reqlogin);
}
function gatewaylogin() {
	var login = new GatewayLogin();
	login.token = token;
	sendmsg(((1 << 20) | 1), login);
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
function startWebSocket() {
	console.log("start websocket");
	if (window.WebSocket)
		ws = new WebSocket("ws://" + location.host + "/Gateway/SocketServer");
	else if (window.MozWebSocket)
		ws = new MozWebSocket("ws://" + location.host + "/Gateway/SocketServer");
	else {
		alert("No Support websocket");
		return;
	}
	ws.binaryType = "arraybuffer";

	ws.onopen = function() {
		console.log("success open");
		$("#sendbutton").attr("disabled", false);

	};
	ws.onmessage = function(evt) {

		if (typeof (evt.data) == "string") {
			console.log("RECEIVE:" + evt.data);
			handleData(evt.data);
		} else {
			var msg = null;
			var bb = ByteBuffer.wrap(evt.data, "binary");
			var pack = Pack.decode(bb);
			var header = pack.header;
			// console.log(pack.toString());
			if (header.packageType == 3) {
				msg = PublishMsg.decode(pack.body);
				var topic = msg.topic;
				showMessage("topic:" + topic);
				for (j = 0; j < msg.item.length; j++) {
					var item = msg.item[j];
					var key = item.key;
					var type = item.type;
					var value = item.value[0];
					if (type == DataType.STRING)
						value = item.strVal[0];
					else if (type == DataType.INT64)
						value = item.lVal[0];
					else if (type == DataType.UINT64)
						value = item.ulVal[0];
					else if (type == DataType.INT32)
						value = item.iVal[0];
					else if (type == DataType.UINT32)
						value = item.uiVal[0];
					else if (type == DataType.FLOAT)
						value = item.fVal[0];
					else if (type == DataType.DOUBLE)
						value = item.fVal[0];
					else if (type == DataType.DATETIME)
						value = item.ulVal[0];
					showMessage("key:" + key + ",type:" + type + ",value:"
							+ value);
				}
			} else if (header.command == 0) {
				msg = ErrMsg.decode(pack.body); // Decode
				showMessage("errcode:" + msg.errcode + ",errmsg:" + msg.errmsg);
			} else if (header.command == ((5 << 20) | 8)) {
				msg = ResLogin.decode(pack.body);
				if (msg.result == 0) {
					token = msg.token;
					userid = msg.userid;
					showMessage("login success,token=" + token);
					gatewaylogin();

				} else
					console.log(msg.error_desc);
			} else if (header.command == ((1 << 20) | 1)) {
				msg = GatewayResp.decode(pack.body);
				if (msg.retcode == 0)
					showMessage("Gateway login success");
//				requestAllUser(userid);
			} else if (header.command == ((500 << 20) | 2)) {
				msg = Hello.decode(pack.body);
				showMessage(msg.str);
			} else if(header.command == (((64 << 20) | 3))) {
				msg = ISResRosterInfo.decode(pack.body);
				responseAllUser(msg);
			}

		}
	};
	ws.onclose = function(event) {
		console.log("Client notified socket has closed", event);
	};

}
var showmsg = "";
function showMessage(msg) {
	showmsg = showmsg + "<tr><td>" + msg + "</td></tr>";
	$("#receivemsg2").html(showmsg);
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
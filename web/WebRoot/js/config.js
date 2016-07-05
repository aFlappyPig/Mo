var ProtoBuf = dcodeIO.ProtoBuf;
var ByteBuffer = dcodeIO.ByteBuffer;
var Long = dcodeIO.Long;

var serial = 65536;
var token;
var username;
var userid, companyid, accountId;
var realroomid = [],realroomname = "";
var uStart,uEnd;
var roomIds,uId,isShowSelfCompany,UserIds;
var ws;
var allUsers = [];
var allUserIds = [];
var allUserNames = [];
var allCompanys = [];
var allGroups = [];
var allGroupIds = [];
var groupMembers = [];
var groupOwner = [];

var from;
var to;

var mtitle,mtype;

var bar = $(".monitor-message-list").niceScroll({
    cursorborder:"",
    cursorcolor:"#333"
});
var pHeight1,pHeight2;
var gHeight1,gHeight2;

var todayMsg = [];
var historyMsg = [];

var APPID = 0x00B;
var KEY_SM_SERVER_ID = 1;
var KEY_SM_USER_ID = 2;

var KEY_NOTIFY_NAME = 3; // Message name
var KEY_NOTIFY_CONTENT = 4; // Message content

var KEY_CLIENT_FROM_ID = 5; // For subscribe
var KEY_CLIENT_TO_ID = 6; // For subscribe

var KEY_CLIENT_MSG = 7; // SMMessage
var KEY_CLIENT_PRESENCE = 8; // SMPresence

var SUBID_FROM = 0;
var SUBID_TO = 1;
var SUBID_ROOM_FROM = 2;
var SUBID_ROOM_TO = 3;
var SUBID_MASS_FROM = 4;
var SUBID_MASS_TO = 5;
var SUBID_MASS_ROOM_FROM = 6;

var TOPIC_CLIENT_MASS_MSG = 11534344;

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
var COMMAND_REQUEST_MESSAGE_BY_USER = (500 << 20) | 9;
var COMMAND_REQUEST_MESSAGE_BY_ROOM = (500 << 20) | 10;
var COMMAND_REQUEST_MESSAGE = (500 << 20) | 7;
var COMMAND_EXPORT_MESSAGE = (500 << 20) | 8;
var COMMAND_EXPORT_MESSAGE_PDF = (500 << 20) | 11;
var COMMAND_REQUEST_USER = (64 << 20) | 1;
var COMMAND_REQUEST_ROOM = (64 << 20) | 22;
var COMMAND_MODIFY_PASSWORD = (5 << 20) | 24;
var COMMAND_REQUEST_COMPANY_INFO = (64 << 20) | 17;
var COMMAND_REQUEST_ROOM_INFO = (64 << 20) | 22;
var COMMAND_REQUEST_ROOM_LIST = (64 << 20) | 43;

var COMMAND_DATABUS_HEART_BEAT = (0 << 20) | 5;

var COMMAND_GET_All_GROUPS = (64 << 20) | 118;

var COMMAND_GET_FILE_UPLOADSIZE = (952 << 20) | 5;

var locationurl = "http://172.16.75.83:8080/MonitorApp/";
var wsip = "172.16.75.83";//for test: 172.16.75.83; for product: 180.153.248.133
var wsport = "8080";

var wsLocation = wsip + ":" + wsport;
var path = "/Gateway/SocketServer";
var pictureLocation = "http://172.16.15.92:8888/data";//for test: http://172.16.15.92:8888/data; for product: http://qmfile.idbhost.com:8888/data
var renamelocation = "http://172.16.15.92:8888/data";//for test:http://172.16.15.92:8888/data; for product: http://127.0.0.1:8888/data;
var databus = new $.fn.Databus();
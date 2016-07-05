$(document).ready(function(){
	//from cookie,if had saved name & pwd.
	if($.cookie("bit") == "true"){
		$(".checkbox-container input").attr("checked","checked");
		$("#username_input").val($.cookie("username"));
		$("#password_input").val($.cookie("password"));
	}

	//if is null.
	canlogin();
	$(".login-form-input input").keyup(function(){
		canlogin();
	});

	$(".login-form").delegate(".login-form-button.clickable", "click",function() {
		var username = $("#username_input").val();
		var password = $("#password_input").val();
		if (username == "" || password == "") {
			return;
		}
		startWebSocket(username, password);
	});

	mtitle = $(".dialogue-type.active").attr("title");
	mtype = $(".lefttab .tab-title.active").attr("type");

	// choose 'mtitle',real dialog(mtitle="real") or history dialog(mtitle="history").
	$(".dialogue-type").click(function(){

		mtitle = $(this).attr("title");
		mtype = $(".tab-title.active").attr("type");

		if(!$(this).hasClass("active")) {
			var i = $(this).index();
			$(this).addClass("active").siblings(".dialogue-type").removeClass("active");
		}

		if (mtitle == "history") {//查询历史记录时显示导出按钮和过滤框，实时对话隐藏；
			$(".monitor-operate .filter,.monitor-operate #forexport,.monitor-operate .shr").show();
		}else{
			$(".monitor-operate .filter,.monitor-operate #forexport,.monitor-operate .shr").hide();
		}

		$("input.input_first").next(".monitor-operate-del").trigger("click");
		$("input.input_second").next(".monitor-operate-del").trigger("click");

		$(".monitor-message-list" + "." + mtitle + "." + mtype).show().siblings(".monitor-message-list").hide();
		$(".monitor-search").animate({"right":"-450px"},100).hide(100);

		$(".all " + "." + mtype).trigger("click");
	});

	//choose 'mtype',person2person dialog(mtype="person") or group dialog(mtype="group").
	$(".tab-title").click(function(){
		mtype = $(this).attr("type");
		if(!$(this).hasClass("active")) {
			$(this).addClass("active").show().siblings(".tab-title").removeClass("active");
		}
		if(mtype == "group"){
			$("#searchinput").val("").removeAttr("roomid").attr("placeholder","搜索特定群");
			$(".monitor-member-list.group li").show();

			if($(".monitor-member-list.group li").length == 0){
				getAllGroups();
			}
		}
		if(mtype == "person"){
			$("#searchinput").val("").removeAttr("userid").attr("placeholder","搜索特定对象");
			$(".monitor-member-list.person li").show();

			if($(".monitor-member-list.person li").length == 0){
				getAllUsers();
			}
		}

		$(".monitor-member-list" + "." + mtype).show().siblings(".monitor-member-list").hide();
		$(".monitor-search").animate({"right":"-450px"},100).hide(100);
		$(".monitor-message-list" + "." + mtitle + "." + mtype).show().siblings(".monitor-message-list").hide();
		$(".dropdown-container").addClass("none");

		$(".all " + "." + mtype).trigger("click");
	});

	//all person2person' dialog ,all group' dialog.
	$(".all .group,.all .person").click(function () {
		$("#keyword").val("");
		$("#result").empty("");
		$(this).addClass("active").show().siblings().removeClass("active").hide();
		$(".monitor-member-list.group li,.monitor-member-list.person li").removeClass("active");
		var stag = $(".monitor-search" + "." + mtitle + "." + mtype);
		stag.find(".monitor-operate-input").val("").removeAttr("userid");
		stag.find(".switch").removeClass("active");

		if($(this).is(".person")) {
			$("#conditions span.condi").html("所有人 与 所有人 说的话");
			$("#searchinput").val("").removeAttr("userid").attr("placeholder","搜索特定对象");
			$(".monitor-member-list.person li").show();
		}else{
			$("#conditions span.condi").html("全部群 说的话");
			$("#searchinput").val("").removeAttr("roomid").attr("placeholder","搜索特定群");
			$(".monitor-member-list.group li").show();
		}

		if (mtitle == "real") {
			$(".monitor-message-list" + "." + mtitle + "." + mtype + " li").show();
			realroomid = allGroupIds;

		} else if (mtitle == "history") {
			initLoadMsg();
		}

		realroomname = "全部群";
	});

	function initLoadMsg(){//default: all group or all person 's dialog during recent 1 month.
		$(".monitor-message-list" + "." + mtitle + "." + mtype).empty();

		var mydate = new Date();
		var year = mydate.getFullYear();
		var month = mydate.getMonth() + 1;
		var day = mydate.getDate();
		var today = year + "-" + month + "-" + day;
		var monthago = getPreMonth(today);

		var stag = $(".monitor-search" + "." + mtitle + "." + mtype);

		if(stag.find(".monitor-operate-date.monitor_start_time").val() == "") {
			stag.find(".monitor-operate-date.monitor_start_time").val(monthago);
		}
		$("#conditions span.condi").append("<br />开始时间："+monthago);
		stag.find(".monitor-operate-date.monitor_end_time").val(today);
		$("#conditions span.condi").append("，结束时间："+today);

		if(mtype == "group"){
			roomIds = allGroupIds;
			uId = 0;
			isShowSelfCompany = false;
			UserIds = [];
			requestMessageByRoom(null);
		}
		if(mtype == "person"){
			uStart = allUserIds;
			uEnd = [];
			requestMessageByUser(null);
		}
	}

	$("#searchinput").keyup(function(){//left: person or group filter;
		var word = $(this).val();
		$(this).next().show();
		if(mtype == "person"){
			$(this).removeAttr("userid");
			var pname = "";
			if (word != "") {
				$(".monitor-member-list.person li span.person-name").each(function(){
					pname = $(this).text();
					if(pname.indexOf(word) == -1){
						$(this).parent().hide();
					}else{
						$(this).parent().show();
					}
				});
			}else{
				$(".monitor-member-list.person li").show();
			}
		}
		if(mtype == "group"){
			$(this).removeAttr("roomid");
			var rname = "";
			if(word != ""){
				$(".monitor-member-list.group li span.room-name").each(function(){
					rname = $(this).text();
					if(rname.indexOf(word) == -1){
						$(this).parent().hide();
					}else{
						$(this).parent().show();
					}
				});
			}else{
				$(".monitor-member-list.group li").show();
			}
		}
	});

	$(".searcharea .dropdown-container").delegate(".dropdown-list li","click",function(){//left: person or group filter;
		if(mtype == "person"){
			var uid = $(this).attr("userid");
			var val = $(this).text();
			$(this).closest(".searcharea").find("input").attr("userid",uid).val(val);
			$(this).closest(".dropdown-container").addClass("none");

			$(".monitor-member-list.person").find('li[userid="' + uid + '"]').addClass("active").trigger("click").siblings().removeClass("active");

			var i = $(".monitor-member-list.person").find('li[userid="' + uid + '"]').index();
			$(".monitor-member-list.person").scrollTop(41*i);
			$(".all .person").removeClass("active");
		}
		if(mtype == "group"){
			var roomid = $(this).attr("roomid");
			var val = $(this).text();

			$(this).closest(".searcharea").find("input").attr("roomid",roomid).val(val);
			$(this).closest(".dropdown-container").addClass("none");

			$(".monitor-member-list.group").find('li[roomid="' + roomid + '"]').addClass("active").trigger("click").siblings().removeClass("active");

			var ri = $(".monitor-member-list.group").find('li[roomid="' + roomid + '"]').index();
			$(".monitor-member-list.group").scrollTop(47*ri);
			$(".all .group").removeClass("active");
		}
	});

	$(".switch").click(function(){
		$(this).toggleClass("active");
	});

	$(".lefttab").delegate("li.list-room,li.list-person","click",function(){//left person or group choose for real or history.
		$(this).addClass("active").siblings().removeClass("active");
		$(".all .group,.all .person").removeClass("active");
		$(".dropdown-container").addClass("none");

		if($(this).is(".list-room")){
			var rid = $(this).attr("roomid");
			databus.requestOnce(COMMAND_REQUEST_ROOM, "infoserver", "InfoServer.ISReqUserRoomInfo", "InfoServer.ISResUserRoomInfo", {
				fillRequest: function (request) {
					request.userId = parseInt(groupOwner['"'+rid+'"']);
					request.roomId = [ rid ];
					request.version = [ 0 ];
					request.reqMember = true;
					request.reqOwner = true;
				},
				handleResponse : function(response) {
					if(response.roomInfo.length > 0) {
						var roomInfo = response.roomInfo[0];

						groupMembers['"' + rid + '"'] = roomInfo.memberInfo;
						console.log(groupMembers);
						console.log(roomInfo.memberInfo.length);
					}
				}
			});
		}

		var msgpanel = $(".monitor-message-list" + "." + mtitle + "." + mtype);
		var searchpanel = $(".monitor-search" + "." + mtitle + "." + mtype);

		var mydate = new Date();
		var year = mydate.getFullYear();
		var month = mydate.getMonth() + 1;
		var day = mydate.getDate();
		var today = year + "-" + month + "-" + day;
		var monthago = getPreMonth(today);

		searchpanel.find(".monitor_start_time").val(monthago);
		searchpanel.find(".monitor-operate-date.monitor_end_time").val(today);
		searchpanel.find(".monitor-operate-input").val("").removeAttr("userid");
		searchpanel.find(".switch").removeClass("active");
		
		var leftliId,limsgobj,fromid,toid,roomid;
		var conditions = "";
		if(mtitle == "real" && mtype == "group"){
			conditions = "";
			leftliId = $(this).attr("roomid");
			realroomid = [leftliId];
			realroomname = $(this).find(".room-name").text();
			conditions += '查看群 '+realroomname + ' 的聊天消息';
			$("#searchinput").attr("placeholder","搜索特定群");

			msgpanel.find("li.list-message").each(function(){
				limsgobj = $(this);
				limsgobj.removeClass("none").show();

				roomid = limsgobj.attr("roomid");
				if(roomid == leftliId){
					limsgobj.removeClass("none").show();
				}else{
					limsgobj.addClass("none").hide();
				}
			});
		}else if(mtitle == "real" && mtype == "person"){
			leftliId = $(this).attr("userid");
			conditions = "";
			conditions += "查看 " + $(this).find(".person-name").text() + " 的聊天消息";
			searchpanel.find(".monitor-operate-input.input_first").attr({"userid":leftliId}).val($(this).find(".person-name").text());
			searchpanel.find(".monitor-operate-input.input_second").removeAttr("disabled");
			$("#searchinput").attr("placeholder","搜索特定对象");

			msgpanel.find("li.list-message").each(function(){
				limsgobj = $(this);
				limsgobj.removeClass("none").show();

				fromid = limsgobj.attr("fromid");
				toid = limsgobj.attr("toid");
				if(fromid == leftliId || toid == leftliId){
					limsgobj.removeClass("none").show();
				}else{
					limsgobj.addClass("none").hide();
				}
			});
		}else if(mtitle == "history" && mtype == "group"){
			leftliId = $(this).attr("roomid");
			realroomname = $(this).find(".room-name").text();
			conditions += '查看群 '+realroomname + ' 的聊天消息';
			$("#searchinput").attr("placeholder","搜索特定群");

			roomIds = [leftliId];
			uId = 0;
			isShowSelfCompany = false;
			UserIds = [];

			msgpanel.empty();
			requestMessageByRoom(null);
		}else if(mtitle == "history" && mtype == "person"){
			leftliId = $(this).attr("userid");
			conditions = "";
			conditions += "查看 " + $(this).find(".person-name").text() + " 的聊天消息";
			$("#searchinput").attr("placeholder","搜索特定对象");

			searchpanel.find(".monitor-operate-input.input_first").attr({"userid":leftliId}).val($(this).find(".person-name").text());
			searchpanel.find(".monitor-operate-input.input_second").removeAttr("disabled");
			uStart = [leftliId];
			uEnd = [];
			msgpanel.empty();
			requestMessageByUser(null);
		}
		$("#conditions span.condi").html(conditions);
	});

	$("body").click(function(){//search panel hide.
		$(".monitor-search" + "." + mtitle + "." + mtype).animate({"right":"-450px"},100).hide(100);
	});

	//search panel show. default date during recent 1 month.
	$("#forserach").click(function(){
		mtitle = $(".dialogue-type.active").attr("title");
		mtype = $(".tab-title.active").attr("type");
		var searchpanel = $(".monitor-search" + "." + mtitle + "." + mtype);
		searchpanel.animate({"right":"0"},100).show(100);
		if(mtitle == "history") {
			var mydate = new Date();
			var year = mydate.getFullYear();
			var month = mydate.getMonth() + 1;
			var day = mydate.getDate();
			var today = year + "-" + month + "-" + day;
			var monthago = getPreMonth(today);

			if(searchpanel.find(".monitor_start_time").val() == "") {
				searchpanel.find(".monitor_start_time").val(monthago);
			}
			if(searchpanel.find("monitor_end_time").val() == "") {
				searchpanel.find(".monitor_end_time").val(today);
			}
		}
		return false;
	});

	$(".monitor-search").click(function(){
		return false;
	});

	$(".monitor-operate-input").keyup(function(){
		$(this).removeAttr("userid");
		var word = $(this).val();

		if(word != "") {
			$(this).next().show().next().removeClass("none");
			var ul = $(this).next().next().find("ul");
			ul.empty();
			var find = false;

			if (mtype == "group" && $(".list-room.active").length > 0) {
				var roomid = $(".list-room.active").attr("roomid");

				var members = groupMembers['"'+roomid+'"'];
				var userinfo;
				for(var i = 0;i<members.length;i++){
					userid = parseInt(members[i].id);
					var companyUserIds = allUserIds.join(",");
					if (companyUserIds.indexOf(userid)>-1) {
						userinfo = getCompanyUser(userid);
						name = userinfo.userInfo.name.toString();

						if (name != "" && name.indexOf(word) > -1) {
							ul.append("<li userid=" + userid + ">" + name + "</li>");
							find = true;
						}
					}
				}
			}else{
				var name = "", userid = "";

				for(var i = 0;i<allUsers.length;i++){
					name = allUsers[i].userInfo.name;
					userid = allUsers[i].userInfo.userID;
					if(name.indexOf(word) > -1){
						ul.append("<li userid="+userid+">"+name+"</li>");
						find = true;
					}
				}
			}


			if (!find) {
				ul.append("<div style='text-align:center;'>该用户不存在</div>");
			}
		}else{
			$(this).next().next().addClass("none");
		}
	});

	$(".monitor-operate-input.input_second").keyup(function(){
		var first = $(this).closest(".monitor-search").find(".monitor-operate-input.input_first").val();
		var second = $(this).val();
		if(first == second){
			$(this).closest(".monitor-search").find(".errorinfo").text("不可输入相同人名!");
			$(this).val("").removeAttr("userid").focus();
		}else{
			$(this).closest(".monitor-search").find(".errorinfo").text("");
		}
	});

	$(".monitor-operate-input.input_second").focus(function(){
		var first =  $(this).closest(".monitor-search").find(".monitor-operate-input.input_first").val();
		var firstid =  $(this).closest(".monitor-search").find(".monitor-operate-input.input_first").attr("userid");
		if(first == ""){
			$(this).closest(".monitor-search").find(".monitor-operate-input.input_first").val("").focus();
			return;
		}
		var secondid = $(this).attr("userid");
		if(secondid == firstid){
			$(this).closest(".monitor-search").find(".errorinfo").text("不可输入相同人名!");
			$(this).val("").removeAttr("userid").focus();
		}else{
			$(this).closest(".monitor-search").find(".errorinfo").text("");
		}
	});

	$(".monitor-search .dropdown-container").delegate(".dropdown-list li","click",function(){
		var uid = $(this).attr("userid");
		var val = $(this).text();
		$(this).closest(".monitor-input-container").find(".monitor-operate-input").attr("userid",uid).val(val);
		$(this).closest(".dropdown-container").addClass("none");
		$(this).closest(".monitor-search").find(".monitor-operate-input.input_second").removeAttr("disabled");

		var firstid = $(this).closest(".monitor-search").find(".monitor-operate-input.input_first").attr("userid");
		var secondid = $(this).closest(".monitor-search").find(".monitor-operate-input.input_second").attr("userid");
		if(secondid == firstid){
			$(this).closest(".monitor-input-container").find(".monitor-operate-input").val("").removeAttr("userid").focus();
			$(this).closest(".monitor-search").find("#errorinfo").text("不可输入相同人名!");
		}else{
			$(this).closest(".monitor-search").find("#errorinfo").text("");
		}

		if(mtype == "group" && firstid != ""){
			$(this).closest(".monitor-search").find(".switch").addClass("active");
		}
	});

	$(".showall").click(function(){
		var stag = $(".monitor-search" + "." + mtitle + "." + mtype);
		//if($(".list-person.active").length == 0) {
		stag.find(".monitor-operate-input.input_first").removeAttr("userid").val("");
		//}
		stag.find(".monitor-operate-input.input_second").removeAttr("userid").val("");
		stag.find(".monitor-operate-date").val("");
		stag.find(".dropdown-container").addClass("none");

		var mydate = new Date();
		var year = mydate.getFullYear();
		var month = mydate.getMonth()+1;
		var day = mydate.getDate();
		var today = year + "-" + month +"-" + day;
		var monthago = getPreMonth(today);
		$(".monitor-search" + "." + mtitle + "." + mtype).find(".monitor-operate-date.monitor_start_time").val(monthago);
		stag.find(".monitor-operate-date.monitor_end_time").val(today);
		stag.find(".switch").removeClass("active");
	});

	$(".optbtn.search").click(function() {
		$("#keyword").val("");
		$("#result").text("");

		$(this).closest(".monitor-search").animate({"right":"-450px"},100).hide(100);

		var msgpanel = $(".monitor-message-list" + "." + mtitle + "." + mtype);
		var searchpanel = $(".monitor-search" + "." + mtitle + "." + mtype);
		var leftliId,limsgobj,fromid,suserid,roomid;
		var toid = [];


		var conditions = "",susername;

		searchpanel.find(".monitor-operate-input").each(function(){
			if($(this).val() != "" && $(this).attr("userid") == undefined){
				$(this).val("");
				$(this).next().next(".dropdown-container").addClass("none");
				return ;
			}
		});
		if(searchpanel.find(".monitor-operate-input.input_first").val() != "") {
			suserid = searchpanel.find(".monitor-operate-input.input_first").attr("userid");
			susername = searchpanel.find(".monitor-operate-input.input_first").val();

			searchpanel.find(".switch").addClass("active");
		}else{
			suserid = "";
			susername = "";
		}

		if(mtitle == "real" && mtype == "group"){
			conditions = '';
			if(realroomname != ""){
				conditions += '群 ' + realroomname + "，";
			}

			if(suserid != ""){
				conditions += '<span class="red">'+susername+'</span>说的话';
				searchpanel.find(".switch").addClass("active");
			}

			if(searchpanel.find(".switch").hasClass("active")) {//只查看本公司人
				conditions += '只看本公司人';
			}

			msgpanel.find("li.list-message").each(function () {
				limsgobj = $(this);
				limsgobj.removeClass("none").show();

				roomid = limsgobj.attr("roomid");
				fromid = limsgobj.attr("fromid");

				if(realroomid.length == 1 && realroomid[0] != roomid){//已选中群，不是该群的消息，隐藏
					limsgobj.addClass("none").hide();
				}else{
					if(suserid != "" && suserid != fromid){//指定群内某成员，不是该成员的消息，隐藏
						limsgobj.addClass("none").hide();
					}else{
						if(searchpanel.find(".switch").hasClass("active")) {//只查看本公司人的消息
							for (var i = 0; i < allUserIds.length; i++) {//过滤本公司人，是本公司人的就显示，不是本公司人的就隐藏；
								if (allUserIds[i] == fromid) {
									limsgobj.removeClass("none").show();
									break;
								}else{
									limsgobj.addClass("none").hide();
									continue;
								}
							}
						}
					}
				}
			});
		}else if(mtitle == "real" && mtype == "person"){
			var sfromid = 0,stoid = 0,fromid,toid;
			conditions = '';
			if(searchpanel.find(".monitor-operate-input.input_first").val() != "") {
				sfromid = searchpanel.find(".monitor-operate-input.input_first").attr("userid");
				$(".monitor-member-list.person").find('li[userid="' + sfromid + '"]').addClass("active").siblings().removeClass("active");

				var i = $(".monitor-member-list.person").find('li[userid="' + sfromid + '"]').index();
				$(".monitor-member-list.person").scrollTop(41*i);
				$(".all .person").removeClass("active");
				conditions += '<span class="red">'+searchpanel.find(".monitor-operate-input.input_first").val() + '</span>';
			}else{
				sfromid = 0;
				conditions += '所有人';
				$(".monitor-member-list.person li").removeClass("active");
				$(".all .person").addClass("active");
			}

			if(searchpanel.find(".monitor-operate-input.input_second").val() != "") {
				stoid = searchpanel.find(".monitor-operate-input.input_second").attr("userid");
				conditions += ' 与 <span class="red">'+searchpanel.find(".monitor-operate-input.input_second").val() + '</span> 说的话';
			}else{
				stoid = 0;
				conditions += ' 与 所有人 说的话';
			}

			msgpanel.find("li.list-message").each(function () {
				limsgobj = $(this);
				limsgobj.removeClass("none").show();

				fromid = limsgobj.attr("fromid");
				toid = limsgobj.attr("toid");

				if(sfromid != 0 && sfromid != fromid && sfromid != toid){// || (stoid == fromid || stoid == toid)
					limsgobj.addClass("none").hide();
				}
				if(stoid != 0 && stoid != fromid && stoid != toid){
					limsgobj.addClass("none").hide();
				}
			});
		}else if(mtitle == "history" && mtype == "group"){
			conditions = '';
			if(realroomname != ""){
				conditions += '群 ' + realroomname + "，";
			}
			if(searchpanel.find(".switch").hasClass("active")) {//只查看本公司人
				isShowSelfCompany = true;
				UserIds = allUserIds;

				conditions += '只看本公司人';
			}else {
				isShowSelfCompany = false;
				UserIds = [];
			}

			uId = 0;

			if(searchpanel.find(".monitor-operate-input.input_first").val() != ""){
				uId = parseInt(searchpanel.find(".monitor-operate-input.input_first").attr("userid"));
				susername = searchpanel.find(".monitor-operate-input.input_first").val();
				conditions += '<span class="red">'+susername+'</span> 说的话';
			}

			if(searchpanel.find(".monitor_start_time").val() != '') {
				conditions += '<br />开始时间:' + searchpanel.find(".monitor_start_time").val();
			}else{
				conditions += '<br />开始时间:不限';
			}
			if(searchpanel.find(".monitor_start_time").val() != '') {
				conditions += '，结束时间:' + searchpanel.find(".monitor_end_time").val();
			}else{
				var mydate = new Date();
				var year = mydate.getFullYear();
				var month = mydate.getMonth()+1;
				var day = mydate.getDate();
				var today = year + "-" + month +"-" + day;
				conditions += '，结束时间:' + today;
			}

			msgpanel.empty();
			requestMessageByRoom(null);
		}else if(mtitle == "history" && mtype == "person"){
			var first = "",second = "";
			conditions = '';

			if(searchpanel.find(".monitor-operate-input.input_first").val() != ""){
				first = searchpanel.find(".monitor-operate-input.input_first").attr("userid");
				$(".monitor-member-list.person").find('li[userid="' + first + '"]').addClass("active").siblings().removeClass("active");;
				$(".all .person").removeClass("active");
				uStart = [first];

				var i = $(".monitor-member-list.person").find('li[userid="' + first + '"]').index();
				$(".monitor-member-list.person").scrollTop(41*i);

				conditions += '<span class="red">'+searchpanel.find(".monitor-operate-input.input_first").val() + '</span>';
			}else{
				conditions += '所有人';
				$(".monitor-member-list.person li").removeClass("active");
				$(".all .person").addClass("active");
				uStart = allUserIds;
			}

			if(searchpanel.find(".monitor-operate-input.input_second").val() != ""){
				second = searchpanel.find(".monitor-operate-input.input_second").attr("userid");
				uEnd = [second];

				conditions += ' 与 <span class="red">'+searchpanel.find(".monitor-operate-input.input_second").val() + '</span> 说的话';
			}else{
				uEnd = [];

				conditions += ' 与 所有人 说的话';
			}

			if(searchpanel.find(".input_first").val() == "" && searchpanel.find(".input_second").val() != ""){
				uStart = searchpanel.find(".monitor-operate-input.input_second").attr("userid");
				uEnd = [];
			}

			if(searchpanel.find(".monitor_start_time").val() != '') {
				conditions += '<br />开始时间:' + searchpanel.find(".monitor_start_time").val();
			}else{
				conditions += '<br />开始时间:不限';
			}
			if(searchpanel.find(".monitor_start_time").val() != '') {
				conditions += '，结束时间:' + searchpanel.find(".monitor_end_time").val();
			}else{
				var mydate = new Date();
				var year = mydate.getFullYear();
				var month = mydate.getMonth()+1;
				var day = mydate.getDate();
				var today = year + "-" + month +"-" + day;
				conditions += '，结束时间:' + today;
			}

			msgpanel.empty();
			requestMessageByUser(null);
		}

		$("#conditions span.condi").html(conditions).attr("title",conditions);

		return false;
	});


	$(".monitor-operate").delegate(".optbtn.export", "click",function() {
		$(this).hide().after('<span class="export optspan loading">正在导出，请稍候...</span>');
		exportToPDF(null);
	});

	$(".pulldown").click(function(){
		ssScroll($(".monitor-message-list" + "." + mtitle + "." + mtype)).pullDown();
	});

	// scroll bar
	$(".monitor-member-list,.monitor-group-list").niceScroll({
		cursorborder:"",
		cursorcolor:"#333"
	});
	$(".dropdown-list").niceScroll({
		cursorborder:"",
		cursorcolor:"#555"
	});


	bar[2].scrollend(function(roominfo){
		if(roominfo.current.y == 0) {
			gHeight1 = $(".monitor-message-list.history.group")[0].scrollHeight;
			var t = $(".monitor-message-list.history.group").children().first().attr("lastSendTime");
			requestMessageByRoom(t);
		}
	});


	bar[3].scrollend(function(userinfo){
		if(userinfo.current.y == 0) {
			pHeight1 = $(".monitor-message-list.history.person")[0].scrollHeight;
			var t = $(".monitor-message-list.history.person").children().first().attr("lastSendTime");
			requestMessageByUser(t);
		}
	});

	//search keywords by Enter key.
	$(document).keyup(function(event){
		if(event.keyCode ==13 && $("#keyword").val() != ""){
			highlight();
		}
	});
	$("#keyword").keyup(function(){
		if($(this).val() == ""){
			$("#search-btn-clear").trigger("click");
		}
	});

	$("#search-btn-clear").click(function(){
		$("#keyword").val("");
		$("#result").text("");
		$(".monitor-message-list.history" + "." + mtype + " li").show();

		$(".monitor-message-list.history" + "." + mtype + " li.list-message .msg-content").each(function(){
			$(this)[0].innerHTML = $(this)[0].innerHTML.replace(/<span\s+class=.?highlight.?>([^<>]*)<\/span>/gi,"$1");
		});
	});

	$(".monitor-operate-del").click(function(e){
		$(this).css("display","none");
		if($(this).parent().is(".searcharea")){
			$(".all " + "." + mtype).trigger("click");
		}else{
			$(this).prev().removeAttr("userid").val("");
			$(this).next().addClass("none");
		}
		e.stopPropagation();
	});
	// date picker

	$("body").delegate(".ui-datepicker,.ui-datepicker-prev,.ui-datepicker-next","click",function(){
		return false;
	});


	$("#monitor_start_time_person").datepicker({
		dateFormat: "yy-mm-dd",
		beforeShow:function(){
			$("#monitor_start_time_person").datepicker("option", "maxDate", $("#monitor_end_time_person").val());
		},
		onClose: function( selectedDate ) {
			$( "#monitor_end_time_person" ).datepicker("option", "minDate", selectedDate);
		}
	});
	$("#monitor_end_time_person").datepicker({
		dateFormat: "yy-mm-dd",
		beforeShow:function(){
			var mydate = new Date();
			var year = mydate.getFullYear();
			var month = mydate.getMonth()+1;
			var day = mydate.getDate();
			var today = year + "-" + month +"-" + day;
			$("#monitor_end_time_person").datepicker("option", "maxDate", today);
			$("#monitor_end_time_person").datepicker("option", "minDate", $("#monitor_start_time_person").val());
		},
		onClose: function( selectedDate ) {
			$("#monitor_start_time_person").datepicker("option", "maxDate", selectedDate);
		}
	});

	$("#monitor_start_time_group").datepicker({
		dateFormat: "yy-mm-dd",
		beforeShow:function(){
			$("#monitor_start_time_group").datepicker("option", "maxDate", $("#monitor_end_time_group").val());
		},
		onClose: function( selectedDate ) {
			$( "#monitor_end_time_group" ).datepicker("option", "minDate", selectedDate);
		}
	});
	$("#monitor_end_time_group").datepicker({
		dateFormat: "yy-mm-dd",
		beforeShow:function(){
			var mydate = new Date();
			var year = mydate.getFullYear();
			var month = mydate.getMonth()+1;
			var day = mydate.getDate();
			var today = year + "-" + month +"-" + day;
			$("#monitor_end_time_group").datepicker("option", "maxDate", today);
			$("#monitor_end_time_group").datepicker("option", "minDate", $("#monitor_start_time_group").val());
		},
		onClose: function( selectedDate ) {
			$("#monitor_start_time_group").datepicker("option", "maxDate", selectedDate);
		}
	});





	// popwin - alter password
	$(".monitor-head").delegate(".monitor-head-password","click",function(){
		TINY.box.show({
			html:$("#popwin_editPassword").html(),
			width: 400,
			height:280,
			fixed: false,
			maskid: 'blackmask',
			boxid: 'box_editPassword',
			openjs:function(){
				$("#box_editPassword").find(".popwin_confirm").unbind('click').click(function(){
					var oldPassword = $(".input_oldPassword").last().val();
					var newPassword = $(".input_newPassword").last().val();
					var confirmPassword = $(".input_repeatPassword").last().val();
					if(newPassword != confirmPassword) {
						$(".input_newPassword,.input_repeatPassword").val("");
						$(".input_newPassword").focus();
						$("#box_editPassword").find(".form_error").text("两次输入的密码不一样，请重新输入。");
					}else{
						$("#box_editPassword").find(".form_error").text("");
					}
					if(oldPassword == "" || newPassword == "" || confirmPassword == "" || newPassword  != confirmPassword) {
						return;
					}

					databus.requestOnce(COMMAND_MODIFY_PASSWORD, "accountserver", "AccountServer.ReqUpdateMonitor", "AccountServer.ResUpdateMonitor", {
						fillRequest: function (info) {
							info.accountId = accountId;
							info.companyId = companyid;
							info.oldPassword = hex_md5(oldPassword);
							info.newPassword = hex_md5(newPassword);
						},
						handleResponse: function (response) {
							if (response.result == 0) { // SUCCESS
								console.log("success modify password");
								TINY.box.hide();
							} else {
								$("#box_editPassword").find(".form_error").text("原密码不对，请重新输入。");
								$(".input_oldPassword").val("").focus();
							}
						}
					});
				});
				$("#box_editPassword").find(".popwin_cancel").click(function(){
					TINY.box.hide();
				});
			}
		});
	});

	$(".monitor-head-quit").click(function(){
		clearInterval(intervalId);
		databus.close();
		window.location.reload();
	});
	// popwin - reset alert

	$(".monitor-head").delegate(".monitor-head-alert","click",function(){
		TINY.box.show({
			html:$("#popwin_resetAlert").html(),
			width: 410,
			fixed: false,
			maskid: 'blackmask',
			boxid: 'box_resetAlert',
			openjs:function(){
				$("#box_resetAlert").find(".alert-content").niceScroll({
					cursorborder:"",
					cursorcolor:"#555"
				});
				$("#box_resetAlert").undelegate("click").delegate(".alert-switch-icon","click",function(){
					if($(this).hasClass("disabled")){
						$(this).removeClass("disabled");
					}else{
						$(this).addClass("disabled");
					}
				});
				$("#box_resetAlert").delegate(".alert-operate a","click",function(){
					var inputV = getStrTrim($(this).prev().val());
					if(inputV !== ""){
						$(this).prev().val("");
						var $content = $("#box_resetAlert").find(".alert-content");
						$('<div class="alert-content-info"><span>'+inputV+'</span><span class="alert-info-del"></span></div>').appendTo($content)
							.find(".alert-info-del").unbind("click").bind("click",function(){
								$(this).parent().remove();
							});
					}
				});
				$("#box_resetAlert").find(".popwin_confirm").unbind('click').click(function(){
					alert("success");
				});
				$("#box_resetAlert").find(".popwin_cancel").click(function(){
					TINY.box.hide();
				});
			}
		});
	});


});

function getStrTrim(str){
	return str.replace(/(^\s*)|(\s*$)/g,"");
}
/**
 * 获取上一个月
 *
 * @date 格式为yyyy-mm-dd的日期，如：2014-01-25
 */
function getPreMonth(date) {
	var arr = date.split('-');
	var year = arr[0]; //获取当前日期的年份
	var month = arr[1]; //获取当前日期的月份
	var day = arr[2]; //获取当前日期的日
	var days = new Date(year, month, 0);
	days = days.getDate(); //获取当前日期中月的天数
	var year2 = year;
	var month2 = parseInt(month) - 1;
	if (month2 == 0) {
		year2 = parseInt(year2) - 1;
		month2 = 12;
	}
	var day2 = day;
	var days2 = new Date(year2, month2, 0);
	days2 = days2.getDate();
	if (day2 > days2) {
		day2 = days2;
	}
	if (month2 < 10) {
		month2 = '0' + month2;
	}
	var t2 = year2 + '-' + month2 + '-' + day2;
	return t2;
}

/**
 * 获取下一个月
 *
 * @date 格式为yyyy-mm-dd的日期，如：2014-01-25
 */
function getNextMonth(date) {
	var arr = date.split('-');
	var year = arr[0]; //获取当前日期的年份
	var month = arr[1]; //获取当前日期的月份
	var day = arr[2]; //获取当前日期的日
	var days = new Date(year, month, 0);
	days = days.getDate(); //获取当前日期中的月的天数
	var year2 = year;
	var month2 = parseInt(month) + 1;
	if (month2 == 13) {
		year2 = parseInt(year2) + 1;
		month2 = 1;
	}
	var day2 = day;
	var days2 = new Date(year2, month2, 0);
	days2 = days2.getDate();
	if (day2 > days2) {
		day2 = days2;
	}
	if (month2 < 10) {
		month2 = '0' + month2;
	}

	var t2 = year2 + '-' + month2 + '-' + day2;
	return t2
}
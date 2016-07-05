function getIconCSS(type) {
	var iconCss = '';
	switch (type) {
	case "出":
		iconCss = "bond_chu_icon";
		break;
	case "收":
		iconCss = "bond_shou_icon";
		break;
	case "上":
		iconCss = "bond_shang_icon";
		break;
	case "深":
		iconCss = "bond_shen_icon";
		break;
	default:
		iconCss = "bond_icon_unvisible";
		break;
	}
	return iconCss;
}

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18c
Date.prototype.Format = function(fmt) { // author: meizz
	var o = {
		"M+" : this.getMonth() + 1, // 月份
		"d+" : this.getDate(), // 日
		"h+" : this.getHours(), // 小时
		"m+" : this.getMinutes(), // 分
		"s+" : this.getSeconds(), // 秒
		"q+" : Math.floor((this.getMonth() + 3) / 3), // 季度
		"S" : this.getMilliseconds()
	// 毫秒
	};
	if (/(y+)/.test(fmt))
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "")
				.substr(4 - RegExp.$1.length));
	for ( var k in o)
		if (new RegExp("(" + k + ")").test(fmt))
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k])
					: (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
}

var date = new Date();
Date.prototype.isSameDay = function() {
	return this.getYear() == date.getYear()
			&& this.getMonth() == date.getMonth()
			&& this.getDate() == date.getDate();
}

Array.prototype.hashLength = function() {
	var x = [];
	for (var i = 0; i < this.length; i++) {
		x['_' + this[i]] = this[i];
	}
	var i = 0;
	for ( var b in x) {
		if (typeof x[b] != 'function') {
			i++;
		}
	}
	return i;
}

String.prototype.endWith = function(str) {
	var reg = new RegExp(str + "$");
	return reg.test(this);
}
var errorCount,validateArray = [];
$(document).ready(function(){

});

//初始时set验证数组的值
function validateSet(element, validateType){
	validateArray.push({'element':element,'Vtype':validateType});
}

//删除时清除validateArray里的值
function validateRemove(element){
	var element_selector = element.attr('name'),
		$tmplate_validate,
		need_remove = [];
	for(var i=0,len=validateArray.length; i<len; i++){
		$tmplate_validate = validateArray[i].element;
		if($tmplate_validate.attr('name') == element_selector){
			validateArray.splice(i,1);
			break;
		}
	}
}

//清空validateArray里的值
function validateEmpty(){
	validateArray = [];
}

//提交表单时验证
function validateSubmit($popwin){
	errorCount = 0;
	$(".validateForm").find(".form_error").empty().hide();
	if(!isEmptyObject(validateArray)){
		$.each(validateArray, function(n,v){
			var errorMsg = "";
			var errorCountIn = 0;
			if (v.element.hasClass("input") || v.element.hasClass("textarea")) {
				$.each(v.Vtype,function (key,value){					
					switch(key){
						case 'required' :
							if (v.element.val() == "") {
								errorMsg += " 「必填」";
								errorCountIn++;
							}
							break;
						case 'integer' :
							if( (v.element.val() != "") && !(/^(\+|-)?\d+$/.test( v.element.val() )) ){
								errorMsg += " 「需为整数」";
								errorCountIn++;
							}
							break;
						case 'email' :
							if( (v.element.val() != "") && !(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test( v.element.val() )) ){
								errorMsg += " 「需为邮箱格式」";
								errorCountIn++;
							}
							break;
						case 'range' :
						    var len = getStringLength(v.element.val());
							if ( (value[0] == "") && (value[1] !="") ) {
								if ( (v.element.val() != "") && len > value[1] ) {//v.element.val().length > value[1] ) {
									errorMsg += " 「长度不能超过 "+value[1]+" 个字符 (1个汉字等于2个字符)」";
									errorCountIn++;
								}
							} else if ( (value[0] != "") && (value[1] =="") ) {
								if ( (v.element.val() != "") && len < value[1] ) {//v.element.val().length < value[0] ) {
									errorMsg += " 「长度不能少于 "+value[0]+" 个字符 (1个汉字等于2个字符)」";
									errorCountIn++;
								}
							} else if ( value[0] != "" && (value[1] !="")  ) {
								if ( (v.element.val() != "") &&  (len < value[0] || len > value[1] ) ) { //((v.element.val().length < value[0]) || (v.element.val().length > value[1]))  ) {
									errorMsg += " 「长度需位于区间 "+value[0]+" ~ "+value[1]+" 个字符 (1个汉字等于2个字符)」";
									errorCountIn++;
								}
							}
							break;
						case  'limit':
						    if($.trim(v.element.val()) != "" ){
							    switch(value[0]){
							        case "onlyChinese":
								        if( /[^\u4E00-\u9FA5]/.test(v.element.val()) == true ){
							                errorMsg += value[1];
								            errorCountIn++; 
							            }
									    break;
							        case "onlyNumberic":
                                        if( /[^\d]/.test(v.element.val()) == true ){
						                    errorMsg += value[1];
							                errorCountIn++; 
								        }
								        break;
                                    case "onlyAlphabet":
                                        if( /^([A-Za-z]+\s?)*[A-Za-z]$/.test(v.element.val()) == false){
									        errorMsg += value[1];
									        errorCountIn++;
									    }
                                        break;											
								}
							}
							
                            break;						
					}
				});				
			} else if (v.element.hasClass("radio")) {
				$.each(v.Vtype,function (key,value){
					if (key == "required") {
						var radioValidate = false;
						v.element.find(".radioBox").each(function(){
							if ($(this).hasClass("checked")) {
								//验证成功
								radioValidate = true
							}
						});
						if (!radioValidate) {
							errorMsg += " 「必填」";
							errorCountIn++;
						}
					}
				});
			} else if (v.element.hasClass("checkboxs")) {
				$.each(v.Vtype,function (key,value){
					if (key == "required") {
						var radioValidate = false;
						v.element.find(".checkbox").each(function(){
							if ($(this).hasClass("checked")) {
								//验证成功
								radioValidate = true
							}
						});
						if (!radioValidate) {
							errorMsg += " 「必填」";
							errorCountIn++;
						}
					}
				});
			} else if ((v.element.hasClass("select") || v.element.hasClass("ajaxChosen")) && (v.element)) {
				$.each(v.Vtype,function (key,value){
					if (key == "required") {
						if (!v.element.val()) {
							errorMsg += " 「必填」";
							errorCountIn++;
						}
					}
				});
			}
			if (errorCountIn != 0) {
				validateError(v.element, errorMsg)
			}
		});
	}
}
function validateError(_element, errorMsg){
	var errorTitle = "";
	errorCount++;
	errorTitle = _element.prev(".validateTitle").text().replace("：","");

	_element.closest(".validateForm").find(".form_error").show().append('<p>! 请检查 <a class="form_errorItem" validateItem="'+_element+'">'+errorTitle+'</a> 栏:'+errorMsg+'</p>');
	_element.closest(".validateForm").find(".form_error").find(".form_errorItem:last").click(function(){
		if (_element.hasClass("input") || _element.hasClass("textarea")) {
			_element.focus();
		}else if (_element.hasClass("radio") || _element.hasClass("checkboxs")) {
			_element.last().find("input:eq(0)").focus();
		} else if (_element.hasClass("select") || _element.hasClass("ajaxChosen")) {
			_element.focus();
		}
	});
}

function  getStringLength(str){
    return str.replace(/[^\x00-\xff]/g,"**").length;
}

isEmptyObject = function(obj) {
	for (var name in obj) {
		return false;
	}
	return true;
};
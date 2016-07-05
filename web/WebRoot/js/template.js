var MessageTemplate = [
		// 日期
		"<div class='message_begin_date'>{time}</div>",

		// 发送带人名
		"<div class='message_send_buddy_name' style='{displayName}'>\
	    <div class='buddy_name'>{buddyName}</div>\
    </div>\
    <div class='message_send_content' style='{paddingBottom}'>\
		<div class='content' id='msg_content' style='{newline}'>{msgHtml}<div class='error_info' style='{error_show}'>{errorInfo}</div></div>\
		<div class='msg_time'>{msgtime}</div>\
    </div>",

		// 接收带人名
		"<div class='message_recv_buddy_name' style='{displayName}'>\
	    <div class='buddy_name' userId='{userid}'><span class='recv_buddy_name_span'>{buddyName}</span></div>\
    </div>\
    <div class='message_recv_content' style='{paddingBottom}'>\
        <div class='content' id='msg_content' style='{newline}'>{msgHtml}</div>\
        <div class='msg_time'>{msgtime}</div>\
    </div>",

		// 发送无人名
		"<div class='message_send_buddy_name' style='{displayName}'>\
	    <div class='buddy_name'>{buddyName}</div>\
    </div>\
    <div class='message_send_content' style='{paddingBottom}'>\
        <div class='content' id='msg_content' style='{newline}'>{msgHtml}<div class='error_info' style='{error_show}'>{errorInfo}</div></div>\
		<div class='msg_time'>{msgtime}</div>\
    </div>",

		// 接收无人名
		"<div class='message_recv_buddy_name' style='{displayName}'>\
	    <div class='buddy_name' userId='{userid}'><span class='recv_buddy_name_span'>{buddyName}</span></div>\
    </div>\
    <div class='message_recv_content' style='{paddingBottom}'>\
        <div class='content' id='msg_content' style='{newline}'>{msgHtml}</div>\
        <div class='msg_time'>{msgtime}</div>\
    </div>",

		// 查看更多
		"{content}",
		// 查看更多历史消息
		"{content}",
		// 一下是新消息
		"{content}",
		// 提醒消息
		"<div class='message_remider_content'>{content}</div>",

		"<div class='history_msg_send_item'>\
        <div class='send_buddy_name'>{buddyName}</div>\
        <div class='send_time'>{msgtime}</div>\
    </div>\
    <div class='send_content' id='msg_content' style='{newline}'>{msgHtml}</div>",

		"<div class='history_msg_recv_item'>\
        <div class='recv_buddy_name'>{buddyName}</div>\
        <div class='recv_time'>{msgtime}</div>\
    </div>\
    <div class='recv_content' id='msg_content' style='{newline}'>{msgHtml}</div>",

		"<a id='msg{hrefid}' name='msg{nameid}'></a>\
	 <div class='history_msg_begin_date'>{time}</div>" ];

var HistoryMessageTemplate = [
		"<div class='fix auto'>\
          <div class='cell recv_buddy_name'>{buddyName}</div>\
          <div class='cell msg_time'>{msgtime}</div>\
      </div>\
      <div class='fix auto' style='width:100%;'>\
          <div class='cell recv_content'>\
		      <div class='cell_bk'>{msgHtml}</div>\
		  </div>\
      </div>",

		"<div class='fix auto'>\
          <div class='cell send_buddy_name'>{buddyName}</div>\
          <div class='cell msg_time'>{msgtime}</div>\
      </div>\
      <div class='fix auto' style='width:100%;'>\
          <div class='cell send_content'>\
		      <div class='cell_bk'>{msgHtml}</div>\
		  </div>\
      </div>",

		"<div class='fix auto'>\
          <div class='cell recv_buddy_name'>{buddyName}</div>\
          <div class='cell msg_time'>{msgtime}</div>\
      </div>\
      <div class='fix auto' style='width:100%;'>\
          <div class='cell recv_content'>{msgHtml}</div>\
      </div>",

		"<div class='fix auto'>\
          <div class='cell send_buddy_name'>{buddyName}</div>\
          <div class='cell msg_time'>{msgtime}</div>\
      </div>\
      <div class='fix auto' style='width:100%;'>\
          <div class='cell send_content'>{msgHtml}</div>\
      </div>" ];

var MessageTransferTemplate = [
		"<div class='file-info detail-info' ondblclick='openFile(this);'>\
        <div class='details'>\
            <div class='file-type'>\
                <img  class='doc-icon'  src=\"{imgpath}\">\
            </div>\
            <p class='file-name'>{filename}</p>\
        <div>\
        <div class='file-size'>{filesize}</div>\
            <div  id='toolbar{toolbarId}' class='receive-act-btns'>\
                <a id='btnRecv{btnRecvId}' href='javascript:;' class='receive' value='{msgId1}' data-toggle='popover' title='{btnrecv}' onclick='downloadFile(this);'></a>\
                <a id='btnSaveas{btnSaveasId}' href='javascript:;' class='donwload' value='{msgId2}' data-toggle='popover' title='{btnsaveas}' onclick='saveFile(this);'></a>\
                <a id='btnReject{btnRejectId}' href='javascript:;' class='reject' value='{msgId3}' data-toggle='popover' title='{btnreject}' onclick='cancelRecv(this);'></a>\
            </div>\
        </div>\
        </div>\
        <i id='progress{progressId}' class='progress-bar receive-file' style='width:0%'></i>\
        <a id='btnCancel{btnCancelId}' href='javascript:;' class='close-send' value='{msgId4}' data-toggle='popover' title='{btncancel}' onclick='refuseRecv(this);'></a>\
        <div id='statusbar{statusbarId}' class='process-status' style='display:none;'>\
            <span id='status{statusId}' class='status'></span>\
        </div>\
    </div>",

		"<div class='file-info detail-info'>\
        <div class='details'>\
            <div class='file-type'>\
                <img class='doc-icon' src=\"{imgpath}\">\
            </div>\
            <p class='file-name'>{filename}</p>\
        <div>\
        <div class='file-size'>{filesize}</div>\
            <div  id='toolbar{toolbarId}' class='receive-act-btns'>\
                <a id='btnOffline{btnOfflineId}' href='javascript:;' class='cloud' value='{msgId1}' data-toggle='popover' title='{btncloud}' onclick='sendFileOffline(this);'></a>\
                <a id='btnReject{btnRejectId}' href='javascript:;' class='reject' value='{msgId2}' data-toggle='popover' title='{btnreject}' onclick='cancelSend(this);'></a>\
            </div>\
        </div>\
        </div>\
        <i id='progress{progressId}' class='progress-bar receive-file' style='width:0%'></i>\
        <a id='btnCancel{btnCancelId}' href='javascript:;' class='close-send' value='{msgId3}' data-toggle='popover' title='{btncancel}' onclick='refuseSend(this);'></a>\
        <div id='statusbar{statusbarId}' class='process-status' style='display:none;'>\
            <span id='status{statusId}' class='status'></span>\
        </div>\
    </div>" ];

var BondTemplate = [
		// money market 发布
		"<div class='quotation'>\
		<div class='card'>\
			<div class='card-header'>{headerTitle}</div>{itemList}</div>\
	</div>",

		// money market 撤销
		"<div class='quotation'>\
		<div class='card'>\
		    <div class='cancel-card-header'>{headerTitle}</div>{itemList}</div>\
	</div>",

		// money market 回复
		"<div class='quotation'>\
		<div class='card'>\
		    <div class='confirm-card-header'>{headerTitle}</div>{itemList}</div>\
	</div><div  class='bond_reply'  style='{displayRemark}'>{remark}</div>",

		// 发出条件
		"<div class='quotation'>\
		<div class='card'>\
		   <div class='card-header'>{headerTitle}</div>{content}</div>\
	</div>",

		// 回复发出条件
		"<div class='quotation'>\
		<div class='card'>\
			<div class='confirm-card-header' style='{displayHeader}'>{headerTitle}</div>{content}</div>\
	</div><div  class='bond_reply'  style='{displayRemark}'>{remark}</div>",

		// 撤销发出条件
		"<div class='quotation'>\
		<div class='card'>\
		    <div class='cancel-card-header'>{headerTitle}</div>{content}</div>\
	</div>",

		// 发布价格
		"<div class='quotation'>\
		<div class='card'>\
			<div class='card-header'>{headerTitle}</div>{content}</div>\
	</div>",

		// 回复价格
		"<div class='quotation'>\
		<div class='card'>\
			<div class='confirm-card-header' style='{displayHeader}'>{headerTitle}</div>{content}</div>\
	</div><div  class='bond_reply'  style='{displayRemark}'>{remark}</div>",

		// 撤销价格
		"<div class='quotation'>\
		<div class='card'>\
			<div class='cancel-card-header'>{headerTitle}</div>{content}</div>\
	</div>"

];

var BondTagTemplate = [ "<div class='tag tag-green right-indent'>{tag}</div>",
		"<div class='tag-disable tag-navy-disable right-indent'>{tag}</div>",
		"<div class='tag tag-green right-indent'>{tag}</div>" ];

var BondTagsTemplate = [ // 发出条件:
		"<div class='{bodyStyle} row-fixed' value='{jsonData}' ondblclick='replyBondBid(this);'>\
                    		<div class='card-row'>\
                    		    <div class='{operation}'></div><div class='icon icon-note bond_memo_icon' style='{displayIcon}'  onmouseover='showBondDetail(this);' onmouseout='hideBondDetail(this);'></div><div id='detail_info' style='float:left;'>{detailInfo}</div></div>\
                    		<div class='card-row top-divider' style='{displayTags}'>{tagList}</div>\
                    	</div>",

		// 撤销发出条件
		"<div class='cancel-card-body row-fixed'>\
                    	 	<div class='card-row'>\
                    		    <div class='{operation}'></div><div class='disable_title line'></div><div class='icon icon-note bond_memo_icon' style='{displayIcon}'  onmouseover='showBondDetail(this);' onmouseout='hideBondDetail(this);'></div><div id='detail_info' style='float:left;'>{detailInfo}</div></div>\
                    		<div class='card-row' style='{displayTags}'>{tagList}</div>\
                    	</div>",
		// 回复发出条件
		"<div class='confirm-card-body row-fixed'>\
                                    	    <div class='card-row'>\
                                    			<div class='{operation}'></div><div class='icon icon-note bond_memo_icon' style='{displayIcon}'  onmouseover='showBondDetail(this);' onmouseout='hideBondDetail(this);'></div><div id='detail_info' style='float:left;'>{detailInfo}</div></div>\
                                    		<div class='card-row' style='{displayTags}'>{tagList}</div>\
                                    	</div>", ];

var BondDetailTemplate = [
		// money market 发布
		"<div class='card-body row-fixed'>\
		<div class='card-row'>\
			<div style='display:inline-block;'>\
			    <div class='{operation}'></div>\
			  	<div class='bond_assets right-indent-large'>{bondAssets}</div>\
			</div>\
			<div style='display:inline-block;'>\
			    <div class='bond_term right-indent handon' data-toggle='popover' title='{termTitle}'>{bondTerm}</div>\
				<div class='bond_count right-indent handon' data-toggle='popover' title='{amountTitle}'>{bondAmount}</div>\
				<div class='bond_price handon' data-toggle='popover' title='{priceTitle}'>{bondPrice}</div>\
			</div>\
		</div>\
		<div class='card-row divider' style='{displayDivider}'>\
			<div class='bond_divider'></div>\
        </div>\
		<div class='card-row bond_memo' style='{displayDescription}'>{description}</div>\
		<div class='clearB'></div>\
	</div>",

		// money market 撤销
		"<div class='cancel-card-body row-fixed' style=''>\
		<div class='card-row'>\
			<div style='display:inline-block;'>\
				<div class='{operation}'></div>\
				<div class='bond_assets right-indent-large'>{bondAssets}</div>\
			</div>\
			<div style='display:inline-block;'>\
				<div class='bond_term_disable disable_title right-indent handon' data-toggle='popover' title='{termTitle}'>{bondTerm}</div>\
				<div class='bond_count_disable disable_title right-indent handon' data-toggle='popover' title='{amountTitle}'>{bondAmount}</div>\
				<div class='bond_price_disable disable_title handon' data-toggle='popover' title='{priceTitle}'>{bondPrice}</div>\
			</div>\
		</div>\
		<div class='card-row divider' style='{displayDivider}'>\
			<div class='bond_divider'></div>\
		</div>\
		<div class='card-row card-row-disable' style='{displayDescription}'>{description}</div>\
		<div class='clearB'></div>\
	</div>",

		// money market 回复
		"<div class='confirm-card-body row-fixed'>\
	    <div class='card-row'>\
	        <div style='display:inline-block;'>\
		        <div class='{operation}'></div>\
		 	        <div class='confirm_bond_assets right-indent-large'>{bondAssets}</div>\
				</div>\
				<div style='display:inline-block;'>\
				    <div class='confirm_bond_term right-indent handon' data-toggle='popover' title='{termTitle}'>{bondTerm}</div>\
			        <div class='confirm_bond_count right-indent handon' data-toggle='popover' title='{amountTitle}'>{bondAmount}</div>\
					<div class='confirm_bond_price handon' data-toggle='popover' title='{priceTitle}'>{bondPrice}</div>\
				</div>\
			</div>\
			<div class='card-row divider' style='{displayDivider}'>\
			    <div class='confirm_bond_divider'></div>\
			</div>\
		<div class='card-row bond_memo' style='{displayDescription}'>{description}</div>\
		<div class='clearB'></div>\
	</div>",

		// 发布价格
		"<div class='{bodyStyle} row-fixed' value='{jsonData}' ondblclick='replyBondBid(this);'>\
	    <div class='row-fluid price_padding'>\
			<div class='card-row'>\
				<div class='{bondPlace}'></div>\
				<div class='bond_code_name {bond_code_name_place}' data-toggle='popover' title='{bond_code_nameLimitTitle}'>{bondName}</div>\
				<div class='bond_date' data-toggle='popover' title='{bondDateLimitTitle}'>{bondDateLimit}</div>\
				<div class='bond_grade' data-toggle='popover' title='{bondGradeTitle}'>{bondGrade}</div>\
			</div>\
			<div class='card-row'>\
				<div class='bond_amount left-indent' data-toggle='popover' title='{bondBidAmountTitle}'>{bondBidAmount}</div>\
				<div class='bond_price_max' data-toggle='popover' title='{bondBidTitle}'>{bondBid}</div>\
				<div class='bond_price_min' data-toggle='popover' title='{bondOfrTitle}'>{bondOfr}</div>\
				<div class='bond_amount' data-toggle='popover' title='{bondOfrAmountTitle}'>{bondOfrAmount}</div>\
				<div class='icon icon-note bond_memo_icon' style='{displayIcon}' onmouseover='showBondDetail(this);' onmouseout='hideBondDetail(this);'>\
					<div id='detail_info' style='display:none;'>{tagList}</div>\
				</div>\
			</div>\
			<div class='clearB'></div>\
		</div>\
	</div>\
	<div class='subscribe_info' style='{subscribe_show}'>\
		<a class='subscribe_name' href='javascript:;' value='{subscribe}' onclick='subscribe(this);'>{subscribetxt}</a>\
		<span class='subscribe_content'>{sub-extendtxt}</span>\
	</div>",

		// 回复价格
		"<div class='confirm-card-body row-fixed'>\
	    <div class='confirm-card-body row-fluid price_padding'>\
			<div class='card-row'>\
				<div class='{bondPlace}'></div>\
				<div class='bond_code_name {bond_code_name_place}' data-toggle='popover' title='{bond_code_nameLimitTitle}'>{bondName}</div>\
				<div class='bond_date confirm' data-toggle='popover' title='{bondDateLimitTitle}'>{bondDateLimit}</div>\
				<div class='bond_grade confirm' data-toggle='popover' title='{bondGradeTitle}'>{bondGrade}</div>\
			</div>\
			<div class='card-row'>\
				<div class='bond_amount confirm left-indent' data-toggle='popover' title='{bondBidAmountTitle}'>{bondBidAmount}</div>\
				<div class='bond_price_max confirm' data-toggle='popover' title='{bondBidTitle}'>{bondBid}</div>\
				<div class='bond_price_min confirm' data-toggle='popover' title='{bondOfrTitle}'>{bondOfr}</div>\
				<div class='bond_amount confirm' data-toggle='popover' title='{bondOfrAmountTitle}'>{bondOfrAmount}</div>\
				<div class='icon icon-note bond_memo_icon' style='{displayIcon}' onmouseover='showBondDetail(this);' onmouseout='hideBondDetail(this);'>\
					<div id='detail_info' style='display:none;'>{tagList}</div>\
				</div>\
			</div>\
			<div class='clearB'></div>\
		</div>\
	</div>",

		// 撤销价格
		"<div class='cancel-card-body row-fixed'>\
	    <div class='cancel-card-body row-fluid price_padding'>\
			<div class='card-row'>\
				<div class='{bondPlace}'></div>\
				<div class='bond_code_name {bond_code_name_place}' data-toggle='popover' title='{bond_code_nameLimitTitle}'>{bondName}</div>\
				<div class='bond_date disable_title' data-toggle='popover' title='{bondDateLimitTitle}'>{bondDateLimit}</div>\
				<div class='bond_grade disable_title' data-toggle='popover' title='{bondGradeTitle}'>{bondGrade}</div>\
			</div>\
			<div class='card-row'>\
				<div class='bond_amount disable_title left-indent' data-toggle='popover' title='{bondBidAmountTitle}'>{bondBidAmount}</div>\
				<div class='bond_price_max disable_title' data-toggle='popover' title='{bondBidTitle}'>{bondBid}</div>\
				<div class='bond_price_min disable_title' data-toggle='popover' title='{bondOfrTitle}'>{bondOfr}</div>\
				<div class='bond_amount disable_title' data-toggle='popover' title='{bondOfrAmountTitle}'>{bondOfrAmount}</div>\
				<div class='icon icon-note bond_memo_icon' style='{displayIcon}' onmouseover='showBondDetail(this);' onmouseout='hideBondDetail(this);'>\
					<div id='detail_info' style='display:none;'>{tagList}</div>\
				</div>\
			</div>\
			<div class='clearB'></div>\
		</div>\
	</div>" ];

var PopBondTemplate = [
		"<div class='quotation'>\
		<div class='card'>\
		    <div class='reply-card-body row-fixed'>\
		        <div class='card-row'>\
			         <div style='display:inline-block;'>\
			            <div class='{operation}'></div>\
			  	        <div class='confirm_bond_assets reply right-indent-large'>{bondAssets}</div>\
					</div>\
					<div style='display:inline-block;'>\
					    <div class='confirm_bond_term reply right-indent handon' style='width:70px;' data-toggle='popover' title='{termTitle}'>{bondTerm}</div>\
				        <div class='confirm_bond_count reply right-indent handon' style='width:60px;' data-toggle='popover' title='{amountTitle}'>{bondAmount}</div>\
						<div class='confirm_bond_price reply handon' style='width:60px;' data-toggle='popover' title='{priceTitle}'>{bondPrice}</div>\
					</div>\
				</div>\
				<div class='card-row divider' style='{displayDivider}'>\
				    <div class='confirm_bond_divider'></div>\
				</div>\
				<div class='card-row bond_memo' style='{displayDescription}'>{description}</div>\
	        </div>\
		</div>\
	</div>",

		"<div class='quotation'>\
	    <div class='card'>\
		    <div class='reply-card-body row-fixed'>\
	            <div class='card-row'>\
			        <div class='{operation}'></div>{amount}<div class='icon icon-note bond_memo_icon' style='{displayIcon}'  onmouseover='showBondDetail(this);' onmouseout='hideBondDetail(this);'><div id='detail_info' style='display:none;'>{detailInfo}</div></div></div>\
		            <div class='card-row' style='{displayTags}'>{tagList}</div>\
	        </div>\
		</div>\
	</div>\
	<div  class='bond_reply'  style='{displayRemark}'>{remark}</div>",

		"<div class='quotation'>\
		<div class='card'>\
			<div class='reply-card-body row-fixed'>\
		        <div class='card-row'>\
			        <div class='{bondPlace}'></div>\
	 		        <span class='bond_code_name {bond_code_name_place}' data-toggle='popover' title='{bond_code_nameLimitTitle}'>{bondName}</span>\
			        <span class='bond_date reply' data-toggle='popover' title='{bondDateLimitTitle}'>{bondDateLimit}</span>\
			        <span class='bond_grade reply' data-toggle='popover' title='{bondGradeTitle}'>{bondGrade}</span>\
		        </div>\
		        <div class='card-row'>\
			        <span class='bond_amount reply left-indent' data-toggle='popover' title='{bondBidAmountTitle}'>{bondBidAmount}</span>\
			        <span class='bond_price_max reply' data-toggle='popover' title='{bondBidTitle}'>{bondBid}</span>\
			        <span class='bond_price_min reply' data-toggle='popover' title='{bondOfrTitle}'>{bondOfr}</span>\
			        <span class='bond_amount reply' data-toggle='popover' title='{bondOfrAmountTitle}'>{bondOfrAmount}</span>\
			        <div class='icon icon-note bond_memo_icon' style='{displayIcon}' onmouseover='showBondDetail(this);' onmouseout='hideBondDetail(this);'>\
		            <div id='detail_info' style='display:none;'>{tagList}</div>\
		        </div>\
		    </div>\
	        </div>\
		</div>\
	</div>\
	<div  class='bond_reply'  style='{displayRemark}'>{remark}</div>" ];

var GroupTemplate = [ "<div class='group_card'>\
		 <div class='group_name'>{groupName}</div>\
		 <div class='group_detail' style='margin-top:3px;'>\
		    <div class='div_left'>\
		      <div class='group_number_title indent' style='display:inline-block;'>{groupNumberTitle}</div>\
			  <div class='group_number' style='display:inline-block;'>{groupNumber}</div>\
			</div>\
			<div class='div_right'>\
			  <div class='group_master indent' style='display:inline-block;'>{groupMasterTitle}</div>\
			  <div class='group_master_name' style='display:inline-block;'>{groupMasterName}</div>\
			</div>\
		 </div>\
	     <div class='group_detail' style='margin-top:-3px;'>\
		      <span class='group_total_title indent'>{groupTotalTitle}</span><span class='group_total_number'>{groupMemberTotal}</span><span class='group_total_number'>{groupPeopleTitle}</span>\
	     </div>\
		 <div class='group_btn' style='margin-top:-3px;'>\
		    <div class='group_add_btn'  value='{jsonData}'  member='{isMember}' btnTitle='{btnSendTitle}' onclick='addGroup(this);'>{btnTitle}</div>\
		 </div>\
	</div>" ];

var TxtExtend = [
// 债券文本订阅
"{TxtExtend}\
	<div class='subscribe_info'><a class='subscribe_name' href='javascript:;' value='{subscribe}' onclick='subscribe(this);'>{subscribetxt}</a><span class='subscribe_content'>{sub-extendtxt}</span></div>" ];

var MessageBodyListTemplate = [
		// 普通消息
		"{messagebodylistcontent}",
		// 群发消息
		"<div class='group_send_tip'>{tip}</div><span class='receiver_list' value='{receiverids}' onclick='showGroupMassReceivers(this);'>{receiverList}</span><br>{messagebodylistcontent}",
		// 机器人消息
		"<div><a class='robot_questioner' href='javascript:;' value='{questionerid}' onclick='openChat(this);'>{questioner} </a><span>{roobt_paraphrased}</span></div><div class='left-indent'>{messagebodylistcontent}</div><div>{roobt_autoreply}</div><div class='left-indent'>{roobt_autoreply_content}</div>" ];

var replaceTemplate = [
		// QB 资金券链接
		"<a href='QBQuote_{bondkey}' bondId='{bondkey}' class='bondlink_style' onclick='bondopt(this);'><font color='{linkColor}' >{bondval}</font></a>",
		// 提醒字段
		"<div style='color:{fontColor}'>{highLight}</div>",
		// 网页链接
		"<a href=\"{weburl}\" class='link_style'>{weburl}</a>",
		// 大文本查看更多链接
		"<div  class='see_more_link' style='display:inline-block;' value='{msgid}' onclick='showCompleteMsg(this);'>{seemore}</div>",
		// 群发消息上半部分模板
		"<div class='group_send_tip'>{tip}</div><span class='receiver_list' value='{receiverids}' onclick='showGroupMassReceivers(this);'>{receiverList}</span>"

];

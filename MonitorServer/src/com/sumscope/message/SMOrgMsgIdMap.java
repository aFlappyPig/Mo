package com.sumscope.message;

import com.j256.ormlite.field.DatabaseField;
import com.j256.ormlite.table.DatabaseTable;
import com.sumscope.SM.SMMessage;

@DatabaseTable(tableName="org_msgid_map")
public class SMOrgMsgIdMap {
	
	public static final String COLUMN_SESSION_ID = "sessionid";
	
	public static final String COLUMN_MSG_ID = "msgid";

	public static final String COLUMN_ORG_MSGID = "org_msgid";
	
	public static final String COLUMN_TIME = "time";
	
	@DatabaseField
	private long id;
	
	@DatabaseField(columnName=COLUMN_SESSION_ID)
	private String sessionId;
	
	@DatabaseField(columnName=COLUMN_MSG_ID)
	private long msgId;
	
	@DatabaseField(columnName=COLUMN_ORG_MSGID)
	private long orgMsgId;
	
	@DatabaseField
	private long time;
	
	private SMMessageWrapper message;

	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public String getSessionId() {
		return sessionId;
	}

	public void setSessionId(String sessionId) {
		this.sessionId = sessionId;
	}

	public long getMsgId() {
		return msgId;
	}

	public void setMsgId(long msgId) {
		this.msgId = msgId;
	}

	public long getOrgMsgId() {
		return orgMsgId;
	}

	public void setOrgMsgId(long orgMsgId) {
		this.orgMsgId = orgMsgId;
	}

	public long getTime() {
		return time;
	}

	public void setTime(long time) {
		this.time = time;
	}

	public SMMessageWrapper getMessage() {
		return message;
	}

	public void setMessage(SMMessageWrapper message) {
		this.message = message;
	}

	public SMMessage createSMMessage() {
		String[] ids = sessionId.split("_");
		if(ids != null && ids.length == 2) {
			message.setTouser(Long.valueOf(ids[1]));
		}
		message.setSendtime(getTime());
		return message.createSMMessage();
	}
	
}

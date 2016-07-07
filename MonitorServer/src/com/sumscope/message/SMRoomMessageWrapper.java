package com.sumscope.message;

import com.google.protobuf.ByteString;
import com.j256.ormlite.field.DataType;
import com.j256.ormlite.field.DatabaseField;
import com.j256.ormlite.table.DatabaseTable;
import com.sumscope.SM.MSG_TYPE;
import com.sumscope.SM.SMHeader;
import com.sumscope.SM.SMMessage;

@DatabaseTable(tableName = "roommessage")
public class SMRoomMessageWrapper {

	public static final String COLUMN_FROM_USER = "fromuser";

	public static final String COLUMN_TO_USER = "touser";

	public static final String COLUMN_ID = "id";

	public static final String COLUMN_SEND_TIME = "sendtime";
	
	public static final String COLUMN_ROOM_ID= "roomid";

	@DatabaseField
	private long id;

	@DatabaseField
	private long fromuser;

	@DatabaseField
	private long roomid;

	@DatabaseField(dataType = DataType.BYTE_ARRAY)
	private byte[] body;

	@DatabaseField
	private long sendtime;

	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public long getFromuser() {
		return fromuser;
	}

	public void setFromuser(long fromuser) {
		this.fromuser = fromuser;
	}

	public long getRoomid() {
		return roomid;
	}

	public void setRoomid(long roomid) {
		this.roomid = roomid;
	}

	public byte[] getBody() {
		return body;
	}

	public void setBody(byte[] body) {
		this.body = body;
	}

	public long getSendtime() {
		return sendtime;
	}

	public void setSendtime(long sendtime) {
		this.sendtime = sendtime;
	}

	public SMMessage createSMMessage() {
		SMMessage message = SMMessage
				.newBuilder()
				.setHeader(SMHeader.newBuilder().setFrom(getFromuser()).build())
				.addTo(getRoomid()).setType(MSG_TYPE.MSG_TYPE_GROUP_NORMAL)
				.setId(getId()).setBody(ByteString.copyFrom(getBody()))
				.setTime(getSendtime()).build();
		return message;
	}

}

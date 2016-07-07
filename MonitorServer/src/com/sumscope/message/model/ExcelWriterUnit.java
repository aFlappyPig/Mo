package com.sumscope.message.model;

import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.Method;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

import com.google.protobuf.ByteString;
import com.google.protobuf.GeneratedMessage;
import com.google.protobuf.InvalidProtocolBufferException;
import com.sumscope.QMClient.EMessageBodyType;
import com.sumscope.QMClient.EQuotationOpType;
import com.sumscope.QMClient.FileSendInfo;
import com.sumscope.QMClient.FinancialNewsInfo;
import com.sumscope.QMClient.FinancialNewsType;
import com.sumscope.QMClient.MessageBody;
import com.sumscope.QMClient.MessageBodyList;
import com.sumscope.QMClient.MessageBodyListType;
import com.sumscope.QMClient.NewsShareBriefInfo;
import com.sumscope.QMClient.PicSendInfo;
import com.sumscope.QMClient.PurchaseInfo;
import com.sumscope.QMClient.QBMultiStr;
import com.sumscope.QMClient.QuotationMoneyInfo;
import com.sumscope.QMClient.RobotMessageInfo;
import com.sumscope.QMClient.RoomfileInfo;
import com.sumscope.QMClient.SysEmotionInfo;
import com.sumscope.QMClient.TxtContent;
import com.sumscope.SM.SMCompany;
import com.sumscope.SM.SMMessage;
import com.sumscope.SM.SMRoom;
import com.sumscope.SM.SMUserDetailInfo;
import com.sumscope.message.FileDownloadService;
import com.sumscope.message.FileDownloadService.Entity;
import com.sumscope.message.FileDownloadService.ThreeEntity;

public class ExcelWriterUnit implements CVSWriterLineInterface {

	private static final String PACKAGE_NAME = "/com/sumscope/";

	private static final List<String> faces = new ArrayList<String>() {
		{
			add("face.xml");
			add("smartQ.xml");
		}
	};

	private static Map<String, String> facesMap = null;

	private String time;

	private String toUser;

	private String fromUser;

	private String content;

	private String backup;

	public String getTime() {
		return time;
	}

	public void setTime(String time) {
		this.time = time;
	}

	public String getToUser() {
		return toUser;
	}

	public void setToUser(String toUser) {
		this.toUser = toUser;
	}

	public String getFromUser() {
		return fromUser;
	}

	public void setFromUser(String fromUser) {
		this.fromUser = fromUser;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public String getBackup() {
		return backup;
	}

	public void setBackup(String backup) {
		this.backup = backup;
	}

	private static SimpleDateFormat sdf = new SimpleDateFormat(
			"yyyy-MM-dd HH:mm:ss");

	public static ExcelWriterUnit createBySMMessage(
			SMMessage msg,
			ThreeEntity<Map<Long, SMUserDetailInfo>, Map<Long, SMRoom>, Map<String, SMCompany>> en) {
		ExcelWriterUnit unit = new ExcelWriterUnit();
		Calendar cal = Calendar.getInstance();
		cal.setTimeInMillis(msg.getTime());
		unit.setTime(sdf.format(cal.getTime()));
		unit.setFromUser(getName(en, msg.getHeader().getFrom()));
		unit.setToUser(getName(en, msg.getToList().get(0)));
		Entity<String, String> entity = parseContent(msg);
		unit.setContent(entity.getKey());
		unit.setBackup(entity.getValue());
		return unit;
	}

	public static String getName(
			ThreeEntity<Map<Long, SMUserDetailInfo>, Map<Long, SMRoom>, Map<String, SMCompany>> entity,
			Long userId) {
		String unknow = "未知";
		String name = null;
		if (FileDownloadService.isRobot(userId)) {
			return "机器小转";
		}
		if (FileDownloadService.isUser(userId)) {
			SMUserDetailInfo info = entity.getKey().get(userId);
			if (info == null)
				return unknow;
			name = info.getUserInfo().getName();
			SMCompany company = null;
			String companyId = null;
			if (info.getUserInfo() != null
					&& (companyId = info.getUserInfo().getCompanyId()) != null
					&& (company = entity.getZ().get(companyId)) != null) {
				name += "-" + company.getCompanyShortName();
			}
		} else {
			SMRoom room = entity.getValue().get(userId);
			if (room == null)
				return unknow;
			name = room.getName();
		}
		return (name == null || name.length() == 0) ? unknow : name;
	}

	public static Entity<String, String> parseContent(SMMessage message) {
		if (facesMap == null) {
			facesMap = new HashMap<String, String>();
			loadAllFaceFile();
		}
		Entity<String, String> entity = new Entity<String, String>();
		String info = "";
		String backup = "";
		MessageBodyList bodyList = getMsg(MessageBodyList.class,
				message.getBody());
		int i = 0;
		for (MessageBody body : bodyList.getBodyListList()) {
			try {
				if (body.getType() == EMessageBodyType.MSG_Body_Type_TEXT
						.getNumber()) {
					info += new String(body.getMsg().toStringUtf8());
					backup += "文字  ";
				} else if (body.getType() == EMessageBodyType.MSG_Body_Type_Emoticon
						.getNumber()) {
					String name = body.getMsg().toStringUtf8();
					String content = null;
					if ((content = facesMap.get(name)) == null) {
						content = "表情";
					}
					info += "<" + content + ">";
					backup += "表情  ";
				} else if (body.getType() == EMessageBodyType.MSG_Body_Type_File
						.getNumber()) {
					FileSendInfo file = FileSendInfo.parseFrom(body.getMsg()
							.toByteArray());
					if (file.getUuid() != null && file.getUuid().length() > 0) {
						String uuid = file.getUuid();
						String[] contents = uuid.split("_");
						String realUuid = contents[0];
						String year = contents[1].substring(0, 4);
						String date = contents[1].substring(4,
								contents[1].length());
						String url = FileDownloadService.picUrl + year + "/"
								+ date + "/" + realUuid;
						info += String.format(
								FileDownloadService.fileReNameUrl,
								new Object[] { file.getFileName(), url });
					}
					backup += "文件  ";
				} else if (body.getType() == EMessageBodyType.MSG_Body_Type_PIC
						.getNumber()) {
					// var contents = uuid.split("_");
					// var realUuid = contents[0];
					// var year = contents[1].substring(0, 4);
					// var date = contents[1].substring(4, contents[1].length);
					// var img = "<img class=\"lazy\" data-original=\"http://" +
					// pictureLocation
					// + "/" + year + "/" + date + "/" + realUuid + "\">";
					PicSendInfo pic = PicSendInfo.parseFrom(body.getMsg()
							.toByteArray());
					if (pic.getUuid() != null && pic.getUuid().length() > 0) {
						String uuid = pic.getUuid();
						String[] contents = uuid.split("_");
						String realUuid = contents[0];
						String year = contents[1].substring(0, 4);
						String date = contents[1].substring(4,
								contents[1].length());
						String url = FileDownloadService.picUrl + year + "/"
								+ date + "/" + realUuid;
						info += String.format(
								FileDownloadService.fileReNameUrl,
								new Object[] { realUuid + ".jpg", url });
					}
					backup += "图片  ";
				} else if (body.getType() == EMessageBodyType.MSG_Body_Type_Shake
						.getNumber()) {
					info += "<震动>";
					backup += "震动  ";
				} else if (body.getType() == EMessageBodyType.MSG_Body_Type_RoomCard
						.getNumber()) {
					info += "<名片>";
					backup += "名片  ";
				} else if (body.getType() == EMessageBodyType.MSG_Body_Type_QB_QuoteMoney
						.getNumber()) {
					String title = "";
					try {
						QuotationMoneyInfo quotation = QuotationMoneyInfo
								.parseFrom(body.getMsg());
						if (i == 0) {
							if (quotation.getType() == EQuotationOpType.Quotation_Op_Pub_VALUE) {
								title = "发布报价";
							} else if (quotation.getType() == EQuotationOpType.Quotation_Op_Cancel_VALUE) {
								title = "撤销报价";
							} else if (quotation.getType() == EQuotationOpType.Quotation_Op_Rsp_VALUE) {
								title = "回复报价";
							}
						}
						String postscript = quotation.getPostScript();
						String direct = quotation.getDirect().getDisplay();
						String assetsType = quotation.getAssetsType()
								.getDisplay();
						String quotationTerm = "";
						if (quotation.getTermCount() > 0) {
							quotationTerm = quotation.getTerm(0).getDisplay();
						}
						info += postscript + " ";
						info += direct + " ";
						info += assetsType + " ";
						info += quotationTerm + "   ";
						String bondAccount = quotation.getCount().getDisplay();
						String bondPrice = quotation.getPrice().getDisplay();
						info += "   " + bondAccount;
						info += "   " + bondPrice + "   ";
						String tags = "";
						if (quotation.getTagsCount() > 0) {
							for (QBMultiStr str : quotation.getTagsList()) {
								tags += " ";
								tags += str.getDisplay();
							}
						}
						info += tags + "   ";
						String memo = quotation.getMemo();
						info += memo;
						info += "\n";
					} catch (InvalidProtocolBufferException e) {
						e.printStackTrace();
					}
					backup += title;
				} else if (body.getType() == EMessageBodyType.MSG_Body_Type_EnhancedTEXT
						.getNumber()) {
					TxtContent content = getMsg(TxtContent.class, body.getMsg());
					info += content.getContent().toStringUtf8();
					backup += "文字  ";
				} else if (body.getType() == EMessageBodyType.MSG_Body_Type_EnhancedEmoticon
						.getNumber()) {
					SysEmotionInfo sys = SysEmotionInfo
							.parseFrom(body.getMsg());
					String name = sys.getEmotion();
					String content = null;
					if ((content = facesMap.get(name)) == null) {
						content = "表情";
					}
					info += "<" + content + ">";
					backup += "表情  ";
				} else if (body.getType() == EMessageBodyType.MSG_Body_Type_EnhancedShake
						.getNumber()) {
					info += "<抖动>";
					backup += "抖动  ";
				} else if (body.getType() == EMessageBodyType.MSG_Body_Type_FinancialNews
						.getNumber()) {
					FinancialNewsInfo news = FinancialNewsInfo.parseFrom(body
							.getMsg());
					if (news.getType() == FinancialNewsType.News_Txt
							.getNumber()) {
						info += news.getContent().toStringUtf8();
					} else {
						info += "<新闻>";
					}
					backup += "新闻";
				} else if (body.getType() == EMessageBodyType.MSG_Body_Type_News
						.getNumber()) {
					NewsShareBriefInfo news = NewsShareBriefInfo.parseFrom(body
							.getMsg());
					info += news.getContent();
					backup += "新闻";
				} else if (body.getType() == EMessageBodyType.MSG_Body_Type_Purchase
						.getNumber()) {
					PurchaseInfo purchase = PurchaseInfo.parseFrom(body
							.getMsg());
					info += "我已通过QB申购了 " + purchase.getDisplayMain();
					backup += "申购";
				} else if (body.getType() == EMessageBodyType.MSG_body_Type_RoomFile_VALUE) {
					RoomfileInfo file = RoomfileInfo.parseFrom(body.getMsg());
					if (file.getFuuid() != null && file.getFuuid().length() > 0) {
						String uuid = file.getFuuid();
						String[] contents = uuid.split("_");
						String realUuid = contents[0];
						String year = contents[1].substring(0, 4);
						String date = contents[1].substring(4,
								contents[1].length());
						String url = FileDownloadService.picUrl + year + "/"
								+ date + "/" + realUuid;
						info += String.format(
								FileDownloadService.fileReNameUrl,
								new Object[] { file.getFileName(), url });
					}
					backup += "群文件  ";
				} else {
					info += "未知消息";
				}
			} catch (Exception e) {
				e.printStackTrace();
			}

		}

		if (bodyList.getBodyListType() == MessageBodyListType.MSG_Robot_VALUE) {
			try {
				RobotMessageInfo robot = RobotMessageInfo.parseFrom(bodyList
						.getExtendContent());
				String rmiName = robot.getName();
				String rmiOrgName = robot.getOrgname();
				String sayextend = robot.getSayextend();
				info = rmiName + "(" + rmiOrgName + ")" + sayextend + "\n"
						+ info;
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		entity.setKey(info);
		entity.setValue(backup);
		return entity;
	}

	public static <T extends GeneratedMessage> T getMsg(Class<T> c,
			ByteString data) {
		if (c == null)
			return null;
		Method m;
		try {
			m = c.getMethod("parseFrom", new Class[] { byte[].class });
			GeneratedMessage msg = (GeneratedMessage) m.invoke(c,
					new Object[] { data.toByteArray() });
			return (T) msg;
		} catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}

	public void writeLineTo(ExcelFileWriter stream) throws IOException {
		stream.write(getTime());
		stream.write(getFromUser());
		stream.write(getToUser());
		stream.write(getContent());
		stream.write(getBackup());
	}

	private static byte[] generateByString(String s) {
		try {
			if (s == null) {
				s = "";
			}
			return s.getBytes("gb2312");
		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
		return null;
	}

	public static void loadAllFaceFile() {
		for (String face : faces) {
			InputStream in = ExcelFileWriter.class
					.getResourceAsStream(PACKAGE_NAME + face);
			if (in != null) {
				loadFaceFile(in);
				try {
					in.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}
	}

	public static Map<String, String> loadFaceFile(InputStream in) {
		Map<String, String> map = new HashMap<String, String>();
		SAXParserFactory saxfac = SAXParserFactory.newInstance();
		try {
			SAXParser parse = saxfac.newSAXParser();
			parse.parse(in, new FaceHandler());
		} catch (ParserConfigurationException | SAXException | IOException e) {
			e.printStackTrace();
		}
		return map;
	}

	public static class FaceHandler extends DefaultHandler {

		@Override
		public void startElement(String uri, String localName, String qName,
				Attributes attributes) throws SAXException {
			super.startElement(uri, localName, qName, attributes);
			if ("face".equals(qName)) {
				String name = attributes.getValue("name");
				String desc = attributes.getValue("describe");
				facesMap.put(name, desc);
			}
		}
	}

}

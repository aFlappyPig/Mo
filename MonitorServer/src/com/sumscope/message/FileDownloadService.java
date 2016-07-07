package com.sumscope.message;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.sumscope.InfoServer.ISReqCompanyInfo;
import com.sumscope.InfoServer.ISReqUserInfo;
import com.sumscope.InfoServer.ISReqUserRoomInfo;
import com.sumscope.InfoServer.ISResCompanyInfo;
import com.sumscope.InfoServer.ISResUserInfo;
import com.sumscope.InfoServer.ISResUserRoomInfo;
import com.sumscope.Monitor.MessageReq;
import com.sumscope.Monitor.MessageReqByRoom;
import com.sumscope.Monitor.MessageReqByUser;
import com.sumscope.PackageHandler;
import com.sumscope.PackageHandler.DefaultRequestObjectListener;
import com.sumscope.SM.SMCompany;
import com.sumscope.SM.SMMessage;
import com.sumscope.SM.SMRoom;
import com.sumscope.SM.SMUserDetailInfo;
import com.sumscope.message.model.ExcelFileWriter;
import com.sumscope.message.model.ExcelWriterUnit;
import com.sumscope.util.Log;

import databus.Package;

public class FileDownloadService {

	private ExecutorService executor;

	public static String url;

	public static String picUrl;

	public static String fileReNameUrl;
	
	private static String downloadLocation;

	private static FileDownloadService service;

	public static FileDownloadService getService() {
		if (service == null) {
			service = new FileDownloadService();
			InputStream in = FileDownloadService.class
					.getResourceAsStream(PROPERTY_NAME);
			Properties p = new Properties();
			try {
				p.load(in);
				url = p.getProperty("url");
				picUrl = p.getProperty("picUrl");
				fileReNameUrl = p.getProperty("fileReNameUrl");
				downloadLocation = p.getProperty("download_dir");
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		return service;
	}

	public ExecutorService createThreadPool() {
		if (executor == null) {
			executor = Executors.newCachedThreadPool();
		}
		return executor;
	}

	public void requestExportFile(PackageHandler handler, MessageReq req,
			RequestListener<String> callback) {
		createThreadPool().submit(
				new ExportFileTaskByPage(handler, req, callback));
	}

	public void requestExportFileEx(PackageHandler handler,
			MessageReqByUser userReq, MessageReqByRoom roomReq,
			RequestListener<String> callback) {
		createThreadPool()
				.submit(new ExprotFileTaskByPageEx(handler, userReq, roomReq,
						callback));
	}

	public static boolean gengerateFile(
			File file,
			List<SMMessage> list,
			ThreeEntity<Map<Long, SMUserDetailInfo>, Map<Long, SMRoom>, Map<String, SMCompany>> entity)
			throws Exception {
		if (!file.exists() && !file.createNewFile()) {
			return false;
		}
		List<ExcelWriterUnit> units = new ArrayList<ExcelWriterUnit>(
				list.size());
		ExcelWriterUnit header = new ExcelWriterUnit();
		header.setTime("时间");
		header.setFromUser("发送方");
		header.setToUser("接收方");
		header.setContent("内容");
		header.setBackup("备注");
		units.add(header);
		for (SMMessage message : list) {
			units.add(ExcelWriterUnit.createBySMMessage(message, entity));
		}
		writerFile(file, units);
		return true;
	}

	public static void writerFile(File file, List<ExcelWriterUnit> units)
			throws Exception {
		ExcelFileWriter writer = new ExcelFileWriter(file);
		writer.writeExcelBatch(units);
		writer.close();
	}

	private static final SimpleDateFormat TIME_FORMAT = new SimpleDateFormat(
			"yyyy_MM_dd HH_mm_ss");
	private static final Date date = new Date();

	public static String generateFileNameByTime(long time) {
		File file = new File(downloadLocation);
		if (!file.exists()) {
			file.mkdirs();
		}
		date.setTime(time);
		return TIME_FORMAT.format(date) + "_" + time + ".pdf";
	}

	public static String generateFileName() {
		File file = new File(downloadLocation);
		if (!file.exists()) {
			file.mkdirs();
		}
		return System.currentTimeMillis() + ".pdf";
	}

	private static final String PROPERTY_NAME = "/com/sumscope/download.properties";

	public static String generateFileUrl(String name) {
		if (url != null && url.startsWith("http"))
			return url + name;
		return null;
	}

	public class ExprotFileTaskByPageEx extends ExportFileTaskByPage {

		MessageReqByUser userReq;

		MessageReqByRoom roomReq;

		public ExprotFileTaskByPageEx(PackageHandler handler,
				MessageReqByUser userReq, MessageReqByRoom roomReq,
				RequestListener<String> callback) {
			super();
			this.handler = handler;
			this.callback = callback;
			this.userReq = userReq;
			this.roomReq = roomReq;
		}
		
		@Override
		protected boolean isInValid() {
			if(userReq != null) {
				return userReq.getUseridStartList().size() == 0
						&& userReq.getUseridEndCount() == 0;
			}else if(roomReq != null) {
				return roomReq.getRoomIdsList().size() == 0;
			}
			return true;

		}
		
		@Override
		protected long getLastSendTime() {
			if(userReq != null) {
				return userReq.getLastSendTime();
			}else if(roomReq != null) {
				return roomReq.getLastSendTime();
			}
			return 0;
		}

		@Override
		protected List<SMMessage> loadMessage(long lastSendTime) {
			List<SMMessage> messages = null;
			try {
				if (userReq != null) {
					messages = MessageService
							.getService()
							.loadUserMessages(
									userReq.getUseridStartList(),
									userReq.getUseridEndList(),
									(userReq.getStartTime() == null || userReq
											.getStartTime().trim().length() == 0) ? null
											: new SimpleDateFormat(
													"yyyy-MM-dd HH:mm:ss")
													.parse(userReq.getStartTime()
															+ " 00:00:00")
													.getTime(),
									(userReq.getEndTime() == null || userReq
											.getEndTime().trim().length() == 0) ? null
											: new SimpleDateFormat(
													"yyyy-MM-dd HH:mm:ss")
													.parse(userReq.getEndTime()
															+ " 23:59:59")
													.getTime(),
									MessageService.MAX_COUNT, lastSendTime, true);
				} else if (roomReq != null) {
					messages = MessageService
							.getService()
							.loadRoomMessages(
									roomReq.getRoomIdsList(),
									roomReq.getUserId(),
									(roomReq.getStartTime() == null || roomReq
											.getStartTime().trim().length() == 0) ? null
											: new SimpleDateFormat(
													"yyyy-MM-dd HH:mm:ss")
													.parse(roomReq.getStartTime()
															+ " 00:00:00")
													.getTime(),
									(roomReq.getEndTime() == null || roomReq
											.getEndTime().trim().length() == 0) ? null
											: new SimpleDateFormat(
													"yyyy-MM-dd HH:mm:ss")
													.parse(roomReq.getEndTime()
															+ " 23:59:59")
													.getTime(),
									MessageService.MAX_COUNT, lastSendTime,
									roomReq.getIsShowSelfCompany(),
									roomReq.getAllUserIdsList(), true);
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
			return messages;
		}
	}

	public class ExportFileTaskByPage implements Runnable {

		private MessageReq req;
		RequestListener<String> callback;
		public PackageHandler handler;
		volatile int competeCount = 0;
		Object lock = new Object();
		int TIME_OUT = 2 * 60 * 1000; // 最长超时2分钟

		public ExportFileTaskByPage() {

		}

		public ExportFileTaskByPage(PackageHandler handler, MessageReq req,
				RequestListener<String> callback) {
			this.handler = handler;
			this.req = req;
			this.callback = callback;
		}

		protected List<SMMessage> loadMessage(long lastSendTime) {
			List<SMMessage> messages = null;
			try {
				messages = MessageService
						.getService()
						.loadMessage(
								req.getUseridStartList(),
								req.getUseridEndList(),
								(req.getStartTime() == null || req
										.getStartTime().trim().length() == 0) ? null
										: new SimpleDateFormat(
												"yyyy-MM-dd HH:mm:ss").parse(
												req.getStartTime()
														+ " 00:00:00")
												.getTime(),
								(req.getEndTime() == null || req.getEndTime()
										.trim().length() == 0) ? null
										: new SimpleDateFormat(
												"yyyy-MM-dd HH:mm:ss").parse(
												req.getEndTime() + " 23:59:59")
												.getTime(),
								req.getSequenceId(), MessageService.MAX_COUNT,
								req.getIsInclude(), lastSendTime);
			} catch (Exception e) {
				e.printStackTrace();
			}
			return messages;
		}

		private ThreeEntity<Integer, String, Long> requestMessageAndSaveFile(
				long lastSendTime) {
			ThreeEntity<Integer, String, Long> en = new ThreeEntity<Integer, String, Long>();
			try {
				// request message
				List<SMMessage> messages = loadMessage(lastSendTime);
				if (messages == null || messages.size() == 0) {
					en.setKey(0);
					return en;
				}
				en.setKey(messages.size());
				long time = messages.get(0).getTime();
				if (messages.size() > 0) {
					en.setZ(time);
				}
				final String filename = generateFileNameByTime(time);
				en.setValue(filename);
				Map.Entry<Set<Long>, Set<Long>> entry = findUsersAndRooms(messages);
				final ThreeEntity<Map<Long, SMUserDetailInfo>, Map<Long, SMRoom>, Map<String, SMCompany>> entity = new ThreeEntity<Map<Long, SMUserDetailInfo>, Map<Long, SMRoom>, Map<String, SMCompany>>();
				// request rooms
				Set<Long> roomIds = entry.getValue();
				ISReqUserRoomInfo.Builder roomBuilder = ISReqUserRoomInfo
						.newBuilder().setReqMember(false).setReqOwner(false)
						.setUserId(10004837L);
				for (Long roomId : roomIds) {
					roomBuilder.addRoomId(roomId);
					roomBuilder.addVersion(0L);
				}
				final List<SMMessage> list = messages;
				handler.postMessageEx(roomBuilder.build(), null,
						new DefaultRequestObjectListener<ISResUserRoomInfo>() {

							@Override
							public void handleResponse(Package old,
									ISResUserRoomInfo response) {
								List<SMRoom> rooms = response.getRoomInfoList();
								Map<Long, SMRoom> map = new HashMap<Long, SMRoom>();
								for (SMRoom room : rooms) {
									map.put(room.getID(), room);
								}
								entity.setValue(map);
								checkEntity(filename, entity, list);
							}
						});
				// request users
				Set<Long> userIds = entry.getKey();
				ISReqUserInfo.Builder builder = ISReqUserInfo.newBuilder()
						.setOwnerId(0).setDetail(true);
				for (Long userId : userIds) {
					builder.addVersion(0);
					builder.addUserId(userId);
				}
				handler.postMessageEx(builder.build(), null,
						new DefaultRequestObjectListener<ISResUserInfo>() {

							@Override
							public void handleResponse(Package old,
									ISResUserInfo users) {
								List<SMUserDetailInfo> infos = users
										.getUserInfoList();
								Map<Long, SMUserDetailInfo> map = new HashMap<Long, SMUserDetailInfo>();
								Set<String> companyIds = new HashSet<String>();
								for (SMUserDetailInfo info : infos) {
									map.put(info.getUserInfo().getUserID(),
											info);
									if (info.getUserInfo() != null
											&& info.getUserInfo()
													.getCompanyId() != null) {
										companyIds.add(info.getUserInfo()
												.getCompanyId());
									}
								}
								entity.setKey(map);
								if (companyIds.size() > 0) {
									ISReqCompanyInfo.Builder builder = ISReqCompanyInfo
											.newBuilder();
									for (String companyId : companyIds) {
										builder.addCompanyId(companyId);
									}
									handler.postMessageEx(
											builder.build(),
											null,
											new DefaultRequestObjectListener<ISResCompanyInfo>() {

												@Override
												public void handleResponse(
														Package old,
														ISResCompanyInfo response) {
													Map<String, SMCompany> map = new HashMap<String, SMCompany>();
													for (SMCompany company : response
															.getCompanyInfoList()) {
														map.put(company
																.getCompanyId(),
																company);
													}
													entity.setZ(map);
													checkEntity(filename,
															entity, list);
												}
											});
								} else {
									entity.setZ(new HashMap<String, SMCompany>());
									checkEntity(filename, entity, list);
								}
							}
						});
			} catch (Exception e) {
				e.printStackTrace();
			}
			return en;
		}

		public void notifyFileComplete() {
			competeCount++;
			synchronized (lock) {
				lock.notify();
			}
		}
		
		protected boolean isInValid() {
			return req.getUseridStartList().size() == 0
					&& req.getUseridEndCount() == 0;
		}
		
		protected long getLastSendTime() {
			return req.getLastSendTime();
		}

		@Override
		public void run() {
			if (isInValid()) {
				if (callback != null) {
					callback.onError();
				}
				return;
			}
			Log.debug("start export file......");
			long lastSendTime = getLastSendTime();
			if(lastSendTime == 0) {
				lastSendTime = System.currentTimeMillis();
			}
			long sendTime = lastSendTime;
			List<String> files = new ArrayList<String>();
			int total = 0;
			int fileCount = 0;
			while (true) {
				if (sendTime == 0 || sendTime > lastSendTime) {
					break;
				}
				ThreeEntity<Integer, String, Long> entity = requestMessageAndSaveFile(sendTime);
				int count = entity.getKey() == null ? 0 : entity.getKey();
				if (count > 0) {
					fileCount++;
				}
				total += count;
				String filename = entity.getValue();
				if (filename != null && filename.length() > 0) {
					files.add(filename);
				}
				sendTime = entity.getZ() == null ? 0 : entity.getZ();
				Log.debug("lastSendTime:" + lastSendTime);
				// waiting file complete
				if (competeCount != fileCount) {
					synchronized (lock) {
						try {
							Log.debug("waiting complete file...completeCount:"
									+ competeCount + ", fileCount:" + fileCount);
							lock.wait(TIME_OUT);
						} catch (InterruptedException e) {
							Log.debug("current task was intterupted");
							total = 0;
							break;
						}
					}
					if (competeCount != fileCount) {
						// time out, interrupt task;
						Log.debug("waiting complete file timeout...interrupt task");
						total = 0;
						break;
					}
				}
				if (count == 0) {
					break;
				}
			}
			Log.debug("total file count:" + fileCount + ", totalCount:" + total);
			if (total == 0 || files.size() == 0) {
				if (callback != null) {
					callback.onError();
				}
			} else if (files.size() == 1) {
				String name = files.get(0);
				String url = generateFileUrl(name);
				if (callback != null) {
					callback.onGetResult(url);
				}
			} else if (files.size() > 1) {
				// generate zip file
				String zipName = System.currentTimeMillis() + ".zip";
				ZipCompressor compressor = new ZipCompressor(new File(
						downloadLocation, zipName));
				List<File> list = new ArrayList<File>();
				for (String fileName : files) {
					File file = new File(downloadLocation, fileName);
					list.add(file);
				}
				compressor.compress(list);
				for (File f : list) {
					if (f.exists()) {
						f.delete();
					}
				}
				if (callback != null) {
					callback.onGetResult(generateFileUrl(zipName));
				}
			}
			Log.debug("end export file......");
		}

		private void checkEntity(
				final String filename,
				final ThreeEntity<Map<Long, SMUserDetailInfo>, Map<Long, SMRoom>, Map<String, SMCompany>> entity,
				final List<SMMessage> list) {
			if (entity.getKey() == null || entity.getValue() == null
					|| entity.getZ() == null) {
				return;
			}
			// handler
			createThreadPool().submit(new Runnable() {

				@Override
				public void run() {
					boolean result = false;
					try {
						result = gengerateFile(new File(downloadLocation,
								filename), list, entity);
					} catch (Exception e) {
						e.printStackTrace();
					}
					Log.debug("complete filename:" + filename);
					notifyFileComplete();
				}
			});
		}

		public Map.Entry<Set<Long>, Set<Long>> findUsersAndRooms(
				List<SMMessage> messages) {
			final Set<Long> userIds = new HashSet<Long>();
			final Set<Long> roomIds = new HashSet<Long>();
			for (SMMessage message : messages) {
				addId(message.getHeader().getFrom(), userIds, roomIds);
				if (message.getToList() != null && message.getToCount() > 0) {
					addId(message.getTo(0), userIds, roomIds);
				}
			}
			return new Map.Entry<Set<Long>, Set<Long>>() {

				@Override
				public Set<Long> getKey() {
					return userIds;
				}

				@Override
				public Set<Long> getValue() {
					return roomIds;
				}

				@Override
				public Set<Long> setValue(Set<Long> value) {
					return null;
				}
			};
		}

		public void addId(long id, Set<Long> userIds, Set<Long> roomIds) {
			if (isUser(id)) {
				userIds.add(id);
			} else {
				roomIds.add(id);
			}
		}

	}

	public class ExportFileTask implements Runnable {

		MessageReq req;
		RequestListener<String> callback;
		PackageHandler handler;
		Object lock = new Object();

		public ExportFileTask(PackageHandler handler, MessageReq req,
				RequestListener<String> callback) {
			this.handler = handler;
			this.req = req;
			this.callback = callback;
		}

		@Override
		public void run() {
			try {
				// request message
				List<SMMessage> messages = null;
				if (req.getUseridStartList().size() == 0
						|| req.getUseridEndCount() == 0)
					return;
				if (!req.getIsRoom()) {
					try {
						messages = MessageService
								.getService()
								.loadMessage(
										req.getUseridStartList(),
										req.getUseridEndList(),
										(req.getStartTime() == null || req
												.getStartTime().trim().length() == 0) ? null
												: new SimpleDateFormat(
														"yyyy-MM-dd HH:mm:ss")
														.parse(req
																.getStartTime()
																+ " 00:00:00")
														.getTime(),
										(req.getEndTime() == null || req
												.getEndTime().trim().length() == 0) ? null
												: new SimpleDateFormat(
														"yyyy-MM-dd HH:mm:ss")
														.parse(req.getEndTime()
																+ " 23:59:59")
														.getTime(),
										req.getSequenceId(),
										Math.abs(req.getCount()),
										req.getIsInclude(),
										req.getLastSendTime());
					} catch (Exception e) {
						e.printStackTrace();
					}
					// }
				} else {
					try {
						messages = MessageService
								.getService()
								.loadRoomMessage(
										req.getUseridStartList(),
										(req.getStartTime() == null || req
												.getStartTime().trim().length() == 0) ? null
												: new SimpleDateFormat(
														"yyyy-MM-dd HH:mm:ss")
														.parse(req
																.getStartTime()
																+ " 00:00:00")
														.getTime(),
										(req.getEndTime() == null || req
												.getEndTime().trim().length() == 0) ? null
												: new SimpleDateFormat(
														"yyyy-MM-dd HH:mm:ss")
														.parse(req.getEndTime()
																+ " 23:59:59")
														.getTime(),
										req.getSequenceId(),
										Math.abs(req.getCount()));
					} catch (Exception e) {
						e.printStackTrace();
					}
				}
				if (messages == null || messages.size() == 0) {
					if (callback != null) {
						callback.onError();
					}
					return;
				}
				Map.Entry<Set<Long>, Set<Long>> entry = findUsersAndRooms(messages);
				final ThreeEntity<Map<Long, SMUserDetailInfo>, Map<Long, SMRoom>, Map<String, SMCompany>> entity = new ThreeEntity<Map<Long, SMUserDetailInfo>, Map<Long, SMRoom>, Map<String, SMCompany>>();
				// request rooms
				Set<Long> roomIds = entry.getValue();
				ISReqUserRoomInfo.Builder roomBuilder = ISReqUserRoomInfo
						.newBuilder().setReqMember(false).setReqOwner(false)
						.setUserId(10004837L);
				for (Long roomId : roomIds) {
					roomBuilder.addRoomId(roomId);
					roomBuilder.addVersion(0L);
				}
				final List<SMMessage> list = messages;
				handler.postMessageEx(roomBuilder.build(), null,
						new DefaultRequestObjectListener<ISResUserRoomInfo>() {

							@Override
							public void handleResponse(Package old,
									ISResUserRoomInfo response) {
								List<SMRoom> rooms = response.getRoomInfoList();
								Map<Long, SMRoom> map = new HashMap<Long, SMRoom>();
								for (SMRoom room : rooms) {
									map.put(room.getID(), room);
								}
								entity.setValue(map);
								checkEntity(entity, list, callback);
							}
						});
				// request users
				Set<Long> userIds = entry.getKey();
				ISReqUserInfo.Builder builder = ISReqUserInfo.newBuilder()
						.setOwnerId(0).setDetail(true);
				for (Long userId : userIds) {
					builder.addVersion(0);
					builder.addUserId(userId);
				}
				handler.postMessageEx(builder.build(), null,
						new DefaultRequestObjectListener<ISResUserInfo>() {

							@Override
							public void handleResponse(Package old,
									ISResUserInfo users) {
								List<SMUserDetailInfo> infos = users
										.getUserInfoList();
								Map<Long, SMUserDetailInfo> map = new HashMap<Long, SMUserDetailInfo>();
								Set<String> companyIds = new HashSet<String>();
								for (SMUserDetailInfo info : infos) {
									map.put(info.getUserInfo().getUserID(),
											info);
									if (info.getUserInfo() != null
											&& info.getUserInfo()
													.getCompanyId() != null) {
										companyIds.add(info.getUserInfo()
												.getCompanyId());
									}
								}
								entity.setKey(map);
								if (companyIds.size() > 0) {
									ISReqCompanyInfo.Builder builder = ISReqCompanyInfo
											.newBuilder();
									for (String companyId : companyIds) {
										builder.addCompanyId(companyId);
									}
									handler.postMessageEx(
											builder.build(),
											null,
											new DefaultRequestObjectListener<ISResCompanyInfo>() {

												@Override
												public void handleResponse(
														Package old,
														ISResCompanyInfo response) {
													Map<String, SMCompany> map = new HashMap<String, SMCompany>();
													for (SMCompany company : response
															.getCompanyInfoList()) {
														map.put(company
																.getCompanyId(),
																company);
													}
													entity.setZ(map);
													checkEntity(entity, list,
															callback);
												}
											});
								} else {
									entity.setZ(new HashMap<String, SMCompany>());
									checkEntity(entity, list, callback);
								}
							}
						});
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		private void checkEntity(
				final ThreeEntity<Map<Long, SMUserDetailInfo>, Map<Long, SMRoom>, Map<String, SMCompany>> entity,
				final List<SMMessage> list,
				final RequestListener<String> callback) {
			if (entity.getKey() == null || entity.getValue() == null
					|| entity.getZ() == null) {
				return;
			}
			// handler
			createThreadPool().execute(new Runnable() {

				@Override
				public void run() {
					File file = null;
					boolean result = false;
					try {
						result = gengerateFile(file = new File(
								downloadLocation, generateFileName()), list,
								entity);
					} catch (Exception e) {
						e.printStackTrace();
					}
					String url = null;
					if (result
							&& (url = generateFileUrl(file.getName())) != null) {
						callback.onGetResult(url);
					} else {
						callback.onError();
					}
				}
			});
		}

		public Map.Entry<Set<Long>, Set<Long>> findUsersAndRooms(
				List<SMMessage> messages) {
			final Set<Long> userIds = new HashSet<Long>();
			final Set<Long> roomIds = new HashSet<Long>();
			for (SMMessage message : messages) {
				addId(message.getHeader().getFrom(), userIds, roomIds);
				if (message.getToList() != null && message.getToCount() > 0) {
					addId(message.getTo(0), userIds, roomIds);
				}
			}
			return new Map.Entry<Set<Long>, Set<Long>>() {

				@Override
				public Set<Long> getKey() {
					return userIds;
				}

				@Override
				public Set<Long> getValue() {
					return roomIds;
				}

				@Override
				public Set<Long> setValue(Set<Long> value) {
					return null;
				}
			};
		}

		public void addId(long id, Set<Long> userIds, Set<Long> roomIds) {
			if (isUser(id)) {
				userIds.add(id);
			} else {
				roomIds.add(id);
			}
		}

	}

	private static final long ID_USER_MAX = 988888888L;

	private static final long ID_ROOM_RESERVE = 1000000000L;

	private static final long MASS_GROUP_ID_RESERVE = 0x7fffffff00000000L;

	private static final long ID_ORG_START = 988900000L;

	private static final long ID_ORG_END = 989000000L;
	
	private static final long ROBOT_ID = 989000001L;
	
	
	public static boolean isRobot(long userId) {
		return ROBOT_ID == userId;
	}

	/**
	 * 用户或者机构号
	 * 
	 * @param userId
	 * @return
	 */
	public static boolean isUser(long userId) {
		return userId <= ID_USER_MAX || isOrg(userId);
	}

	public static boolean isGroup(long groupId) {
		return groupId >= ID_ROOM_RESERVE;
	}

	public static boolean isSendGroup(long groupId) {
		return groupId >= MASS_GROUP_ID_RESERVE;
	}

	public static boolean isOrg(long orgId) {
		return orgId >= ID_ORG_START && orgId <= ID_ORG_END;
	}

	public static abstract class RequestListener<T> {
		public abstract void onGetResult(T t);

		public abstract void onError();
	}

	public static class ThreeEntity<K, V, Z> extends Entity<K, V> {

		Z z;

		public Z getZ() {
			return z;
		}

		public void setZ(Z z) {
			this.z = z;
		}

	}

	public static class Entity<K, V> {
		K k;
		V v;

		public K getKey() {
			return k;
		}

		public void setKey(K k) {
			this.k = k;
		}

		public V getValue() {
			return v;
		}

		public void setValue(V v) {
			this.v = v;
		}
	}

}

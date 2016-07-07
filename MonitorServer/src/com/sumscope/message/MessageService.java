package com.sumscope.message;

import java.io.InputStream;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Properties;
import java.util.Set;

import com.j256.ormlite.dao.Dao;
import com.j256.ormlite.dao.DaoManager;
import com.j256.ormlite.jdbc.JdbcPooledConnectionSource;
import com.j256.ormlite.stmt.QueryBuilder;
import com.j256.ormlite.stmt.Where;
import com.j256.ormlite.support.ConnectionSource;
import com.sumscope.SM.SMMessage;

public class MessageService {

	private static final String PROPERTY_NAME = "/com/sumscope/db.properties";

	private static final String FILTER_PROPERTY_NAME = "/com/sumscope/filter.properties";

	public static final int MAX_COUNT = 2000;

	private static Set<Long> filterUsers = new HashSet<Long>();

	private Dao<SMMessageWrapper, Long> messageDao;
	private Dao<SMRoomMessageWrapper, Long> roomMessageDao;
	private Dao<SMOrgMsgIdMap, Long> orgMessageDao;

	private ConnectionSource connectionSource;

	private static MessageService service;

	public static MessageService getService() {
		if (service == null) {
			service = new MessageService();
			InputStream in = MessageService.class
					.getResourceAsStream(FILTER_PROPERTY_NAME);
			Properties p = new Properties();
			try {
				p.load(in);
				String filterUsersContent = p.getProperty("filter_user");
				if (filterUsersContent != null
						&& filterUsersContent.length() > 0) {
					String[] allUserIds = filterUsersContent.split(",");
					if (allUserIds != null && allUserIds.length > 0) {
						for (String userId : allUserIds) {
							filterUsers.add(Long.valueOf(userId));
						}
					}
				}
			} catch (Exception e) {
				e.printStackTrace();
			}

		}
		return service;
	}

	private ConnectionSource confirmConnection() throws Exception {
		if (connectionSource == null || !connectionSource.isOpen()) {
			InputStream in = getClass().getResourceAsStream(PROPERTY_NAME);
			Properties p = new Properties();
			p.load(in);
			String url = p.getProperty("databaseUrl");
			connectionSource = new JdbcPooledConnectionSource(url);
			// setup db;
			initDb(connectionSource);
		}
		return connectionSource;
	}

	private void initDb(ConnectionSource conn) throws SQLException {
		messageDao = DaoManager.createDao(conn, SMMessageWrapper.class);
		roomMessageDao = DaoManager.createDao(conn, SMRoomMessageWrapper.class);
		orgMessageDao = DaoManager.createDao(conn, SMOrgMsgIdMap.class);
	}

	public List<SMMessage> loadRoomMessageByFromUser(List<Long> userIds,
			Long startTime, Long endTime, Long baseId, Integer count,
			Long lastSendTime) throws Exception {
		// if(count == null || count == 0 || count > MAX_COUNT ) {
		// return new ArrayList<SMMessage>(0);
		// }
		confirmConnection();
		QueryBuilder<SMRoomMessageWrapper, Long> builder = roomMessageDao
				.queryBuilder();
		Where<SMRoomMessageWrapper, Long> where = builder.where();
		if (userIds != null && userIds.size() > 0) {
			if (userIds.size() == 1) {
				if (userIds.get(0) != 0) {
					where.eq(SMRoomMessageWrapper.COLUMN_FROM_USER,
							userIds.get(0));
				}
			} else {
				where.in(SMRoomMessageWrapper.COLUMN_FROM_USER,
						userIds.toArray());
			}
		}
		if (baseId != null && baseId > 0) {
			where.and();
			where.lt(SMRoomMessageWrapper.COLUMN_ID, baseId);
		}
		if (startTime != null) {
			where.and();
			where.ge(SMRoomMessageWrapper.COLUMN_SEND_TIME, startTime);
		}
		if (endTime != null) {
			where.and();
			where.le(SMRoomMessageWrapper.COLUMN_SEND_TIME, endTime);
		}
		if (lastSendTime != null) {
			where.and();
			where.lt(SMMessageWrapper.COLUMN_SEND_TIME, lastSendTime);
		}
		builder.orderBy(SMRoomMessageWrapper.COLUMN_SEND_TIME, false);
		if (count != null && count != 0) {
			builder.limit(count);
		}
		List<SMRoomMessageWrapper> list = builder.query();
		if (list == null || list.size() == 0)
			return new ArrayList<SMMessage>(0);
		List<SMMessage> returnList = new ArrayList<SMMessage>();
		Collections.reverse(list);
		for (SMRoomMessageWrapper wrapper : list) {
			returnList.add(wrapper.createSMMessage());
		}
		return filterSMMessageByUser(returnList);
	}

	public List<SMMessage> loadRoomMessage(List<Long> roomIds, Long startTime,
			Long endTime, Long baseId, Integer count) throws Exception {
		// if(count == null || count == 0 || count > MAX_COUNT ) {
		// return new ArrayList<SMMessage>(0);
		// }
		confirmConnection();
		QueryBuilder<SMRoomMessageWrapper, Long> builder = roomMessageDao
				.queryBuilder();
		Where<SMRoomMessageWrapper, Long> where = builder.where();
		if (roomIds != null && roomIds.size() > 0) {
			if (roomIds.size() == 1) {
				if (roomIds.get(0) != 0) {
					where.eq(SMRoomMessageWrapper.COLUMN_ROOM_ID,
							roomIds.get(0));
				}
			} else {
				where.in(SMRoomMessageWrapper.COLUMN_ROOM_ID, roomIds.toArray());
			}
		}
		if (baseId != null && baseId > 0) {
			where.and();
			where.lt(SMRoomMessageWrapper.COLUMN_ID, baseId);
		}
		if (startTime != null) {
			where.and();
			where.ge(SMRoomMessageWrapper.COLUMN_SEND_TIME, startTime);
		}
		if (endTime != null) {
			where.and();
			where.le(SMRoomMessageWrapper.COLUMN_SEND_TIME, endTime);
		}
		builder.orderBy(SMRoomMessageWrapper.COLUMN_SEND_TIME, false);
		if (count != null && count != 0) {
			builder.limit(count);
		}
		List<SMRoomMessageWrapper> list = builder.query();
		if (list == null || list.size() == 0)
			return new ArrayList<SMMessage>(0);
		List<SMMessage> returnList = new ArrayList<SMMessage>();
		Collections.reverse(list);
		for (SMRoomMessageWrapper wrapper : list) {
			returnList.add(wrapper.createSMMessage());
		}
		return filterSMMessageByUser(returnList);
	}

	public List<SMMessage> loadMessage(List<Long> fromUsers,
			List<Long> toUsers, Long startTime, Long endTime, Long baseId,
			Integer count) throws Exception {
		return loadMessage(fromUsers, toUsers, startTime, endTime, baseId,
				count, false, null);
	}

	public List<SMMessage> loadMessage(List<Long> fromUsers,
			List<Long> toUsers, Long startTime, Long endTime, Long baseId,
			Integer count, boolean includeRoom, Long lastSendTime)
			throws Exception {
		// if(count == null || count == 0 || count > MAX_COUNT ) {
		// return new ArrayList<SMMessage>(0);
		// }
		if ((fromUsers == null || fromUsers.size() == 0)
				&& (toUsers == null || toUsers.size() == 0))
			return new ArrayList<SMMessage>(0);
		confirmConnection();
		QueryBuilder<SMMessageWrapper, Long> builder = messageDao
				.queryBuilder();
		Where<SMMessageWrapper, Long> where = builder.where();
		if (fromUsers != null && fromUsers.size() > 1 && toUsers != null
				&& toUsers.size() > 1) {
			Set<Long> allUsers = new HashSet<Long>();
			allUsers.addAll(fromUsers);
			allUsers.addAll(toUsers);
			where.in(SMMessageWrapper.COLUMN_FROM_USER, allUsers.toArray());
			where.or();
			where.in(SMMessageWrapper.COLUMN_TO_USER, allUsers.toArray());
		} else {
			boolean canAnd = false;
			if (fromUsers != null && fromUsers.size() > 0) {
				if (fromUsers.size() == 1) {
					if (fromUsers.get(0) != 0) {
						canAnd = true;
						where.eq(SMMessageWrapper.COLUMN_FROM_USER,
								fromUsers.get(0));
					}
				} else {
					canAnd = true;
					where.in(SMMessageWrapper.COLUMN_FROM_USER,
							fromUsers.toArray());
				}
			}
			if (toUsers != null && toUsers.size() > 0) {
				if (toUsers.size() == 1) {
					if (toUsers.get(0) != 0) {
						if (canAnd) {
							where.and();
						}
						where.eq(SMMessageWrapper.COLUMN_TO_USER,
								toUsers.get(0));
					}
				} else {
					if (canAnd) {
						where.and();
					}
					where.in(SMMessageWrapper.COLUMN_TO_USER, toUsers.toArray());
				}
			}

			canAnd = false;
			if (fromUsers != null && fromUsers.size() > 0) {
				if (fromUsers.size() == 1) {
					if (fromUsers.get(0) != 0) {
						canAnd = true;
						where.eq(SMMessageWrapper.COLUMN_TO_USER,
								fromUsers.get(0));
					}
				} else {
					canAnd = true;
					where.in(SMMessageWrapper.COLUMN_TO_USER,
							fromUsers.toArray());
				}
			}
			if (toUsers != null && toUsers.size() > 0) {
				if (toUsers.size() == 1) {
					if (toUsers.get(0) != 0) {
						if (canAnd) {
							where.and();
						}
						where.eq(SMMessageWrapper.COLUMN_FROM_USER,
								toUsers.get(0));
					}
				} else {
					if (canAnd) {
						where.and();
					}
					where.in(SMMessageWrapper.COLUMN_FROM_USER,
							toUsers.toArray());
				}
			}
			where.or(where, where);
		}
		if (baseId != null && baseId > 0) {
			where.and();
			where.lt(SMMessageWrapper.COLUMN_ID, baseId);
		}
		if (lastSendTime != null) {
			where.and();
			where.lt(SMMessageWrapper.COLUMN_SEND_TIME, lastSendTime);
		}
		if (startTime != null) {
			where.and();
			where.ge(SMMessageWrapper.COLUMN_SEND_TIME, startTime);
		}
		if (endTime != null) {
			where.and();
			where.le(SMMessageWrapper.COLUMN_SEND_TIME, endTime);
		}
		builder.orderBy(SMMessageWrapper.COLUMN_SEND_TIME, false);
		if (count != null && count != 0) {
			builder.limit(count);
		}
		List<SMMessageWrapper> list = builder.query();
		if (list == null) {
			list = new ArrayList<SMMessageWrapper>();
		}
		List<SMMessage> returnList = new ArrayList<SMMessage>();
		Collections.reverse(list);
		for (SMMessageWrapper wrapper : list) {
			returnList.add(wrapper.createSMMessage());
		}
		// 非单人对单人的情况
		if (!(isSingleUser(fromUsers) && isSingleUser(toUsers))) {
			boolean isNeedSort = false;
			List<Long> userIds = new ArrayList<Long>();
			if (isSingleUser(fromUsers)) {
				userIds.addAll(fromUsers);
			} else if (isSingleUser(toUsers)) {
				userIds.addAll(toUsers);
			} else {
				if (fromUsers != null) {
					userIds.addAll(fromUsers);
				}
				if (toUsers != null) {
					userIds.addAll(toUsers);
				}
			}
			// // load org msg;
			// List<SMMessage> orgMessages = loadOrgMessage(userIds, startTime,
			// endTime, count, lastSendTime);
			// if (orgMessages != null && orgMessages.size() > 0) {
			// returnList.addAll(orgMessages);
			// isNeedSort = true;
			// }
			if (includeRoom) {
				List<SMMessage> roomMessages = loadRoomMessageByFromUser(
						userIds, startTime, endTime, baseId, count,
						lastSendTime);
				if (roomMessages != null && roomMessages.size() > 0) {
					returnList.addAll(roomMessages);
					isNeedSort = true;
				}
			}
			if (isNeedSort) {
				Collections.sort(returnList, new Comparator<SMMessage>() {

					@Override
					public int compare(SMMessage o1, SMMessage o2) {
						if (o1.getTime() == o2.getTime()) {
							return 0;
						}
						return o1.getTime() > o2.getTime() ? -1 : 1;
					}
				});
				if (count > 0) {
					List<SMMessage> l = returnList;
					if (returnList.size() > count) {
						l = filterSMMessageByUser(returnList.subList(0, count));
					}
					Collections.reverse(l);
					return l;
				}
			}
		}
		return filterSMMessageByUser(returnList);
	}
	
	private List<SMMessage> filterSMMessageByUser(List<SMMessage> returnList, boolean isFilterOrg) {
		if (returnList != null) {
			Iterator<SMMessage> it = returnList.iterator();
			while (it.hasNext()) {
				SMMessage msg = it.next();
				long fromId = msg.getHeader().getFrom();
				if (filterUsers.contains(fromId)) {
					it.remove();
					continue;
				}
				List<Long> toIds = msg.getToList();
				for (Long toId : toIds) {
					if (filterUsers.contains(toId)) {
						it.remove();
						break;
					}
				}
				//屏蔽机构号消息
				if(isFilterOrg && isOrg(msg.getHeader().getFrom())) {
					it.remove();
					continue;
				}
			}
		}
		return returnList;
	}
	
	public List<SMMessage> loadUserMessages(List<Long> fromUsers,
			List<Long> toUsers, Long startTime, Long endTime, Integer count,
			Long lastSendTime, boolean filterOrg) throws Exception {
		// if (count == null || count == 0 || count > MAX_COUNT) {
		// return new ArrayList<SMMessage>(0);
		// }
		if ((fromUsers == null || fromUsers.size() == 0)
				&& (toUsers == null || toUsers.size() == 0))
			return new ArrayList<SMMessage>(0);
		confirmConnection();
		QueryBuilder<SMMessageWrapper, Long> builder = messageDao
				.queryBuilder();
		Where<SMMessageWrapper, Long> where = builder.where();
		if (fromUsers != null && fromUsers.size() > 1 && toUsers != null
				&& toUsers.size() > 1) {
			Set<Long> allUsers = new HashSet<Long>();
			allUsers.addAll(fromUsers);
			allUsers.addAll(toUsers);
			where.in(SMMessageWrapper.COLUMN_FROM_USER, allUsers.toArray());
			where.or();
			where.in(SMMessageWrapper.COLUMN_TO_USER, allUsers.toArray());
		} else {
			boolean canAnd = false;
			if (fromUsers != null && fromUsers.size() > 0) {
				if (fromUsers.size() == 1) {
					if (fromUsers.get(0) != 0) {
						canAnd = true;
						where.eq(SMMessageWrapper.COLUMN_FROM_USER,
								fromUsers.get(0));
					}
				} else {
					canAnd = true;
					where.in(SMMessageWrapper.COLUMN_FROM_USER,
							fromUsers.toArray());
				}
			}
			if (toUsers != null && toUsers.size() > 0) {
				if (toUsers.size() == 1) {
					if (toUsers.get(0) != 0) {
						if (canAnd) {
							where.and();
						}
						where.eq(SMMessageWrapper.COLUMN_TO_USER,
								toUsers.get(0));
					}
				} else {
					if (canAnd) {
						where.and();
					}
					where.in(SMMessageWrapper.COLUMN_TO_USER, toUsers.toArray());
				}
			}

			canAnd = false;
			if (fromUsers != null && fromUsers.size() > 0) {
				if (fromUsers.size() == 1) {
					if (fromUsers.get(0) != 0) {
						canAnd = true;
						where.eq(SMMessageWrapper.COLUMN_TO_USER,
								fromUsers.get(0));
					}
				} else {
					canAnd = true;
					where.in(SMMessageWrapper.COLUMN_TO_USER,
							fromUsers.toArray());
				}
			}
			if (toUsers != null && toUsers.size() > 0) {
				if (toUsers.size() == 1) {
					if (toUsers.get(0) != 0) {
						if (canAnd) {
							where.and();
						}
						where.eq(SMMessageWrapper.COLUMN_FROM_USER,
								toUsers.get(0));
					}
				} else {
					if (canAnd) {
						where.and();
					}
					where.in(SMMessageWrapper.COLUMN_FROM_USER,
							toUsers.toArray());
				}
			}
			where.or(where, where);
		}
		if (lastSendTime != null) {
			where.and();
			where.lt(SMMessageWrapper.COLUMN_SEND_TIME, lastSendTime);
		}
		if (startTime != null) {
			where.and();
			where.ge(SMMessageWrapper.COLUMN_SEND_TIME, startTime);
		}
		if (endTime != null) {
			where.and();
			where.le(SMMessageWrapper.COLUMN_SEND_TIME, endTime);
		}
		builder.orderBy(SMMessageWrapper.COLUMN_SEND_TIME, false);
		if (count != null && count != 0) {
			builder.limit(count);
		}
		List<SMMessageWrapper> list = builder.query();
		if (list == null) {
			list = new ArrayList<SMMessageWrapper>();
		}
		List<SMMessage> returnList = new ArrayList<SMMessage>();
		Collections.reverse(list);
		for (SMMessageWrapper wrapper : list) {
			returnList.add(wrapper.createSMMessage());
		}
		return filterSMMessageByUser(returnList, filterOrg);
	
	}
	

	private List<SMMessage> filterSMMessageByUser(List<SMMessage> returnList) {
		return filterSMMessageByUser(returnList, false);
	}
	
    private static final long ID_ORG_START = 988900000L;
	private static final long ID_ORG_END = 989000000L;
	
	public static boolean isOrg(long orgId) {
		return orgId >= ID_ORG_START && orgId <= ID_ORG_END;
	}

	private boolean isSingleUser(List<Long> userIds) {
		return userIds != null && userIds.size() == 1 && userIds.get(0) > 0;
	}

	public List<SMMessage> loadOrgMessage(List<Long> userIds, Long startTime,
			Long endTime, Integer count, Long lastSendTime) throws Exception {
		if (userIds == null || userIds.size() == 0)
			return new ArrayList<SMMessage>(0);
		confirmConnection();
		QueryBuilder<SMOrgMsgIdMap, Long> builder = orgMessageDao
				.queryBuilder();
		Where<SMOrgMsgIdMap, Long> where = builder.where();
		int i = 0;
		for (Long userId : userIds) {
			if (i != 0) {
				where.or();
			}
			where.like(SMOrgMsgIdMap.COLUMN_SESSION_ID, "%_" + userId);
			i++;
		}
		if (startTime != null) {
			where.and();
			where.ge(SMOrgMsgIdMap.COLUMN_TIME, startTime);
		}
		if (endTime != null) {
			where.and();
			where.le(SMOrgMsgIdMap.COLUMN_TIME, endTime);
		}
		if (lastSendTime != null) {
			where.and();
			where.lt(SMOrgMsgIdMap.COLUMN_TIME, lastSendTime);
		}
		builder.orderBy(SMOrgMsgIdMap.COLUMN_TIME, false);
		if (count != null && count != 0) {
			builder.limit(count);
		}
		List<SMOrgMsgIdMap> list = builder.query();
		if (list == null || list.size() == 0)
			return new ArrayList<SMMessage>(0);
		List<SMMessage> returnList = new ArrayList<SMMessage>();
		Collections.reverse(list);

		List<SMMessageWrapper> resultList = new ArrayList<SMMessageWrapper>();
		HashMap<Long, SMMessageWrapper> map = new HashMap<Long, SMMessageWrapper>();
		for (SMOrgMsgIdMap message : list) {
			QueryBuilder<SMMessageWrapper, Long> messageBuilder = messageDao
					.queryBuilder();
			SMMessageWrapper m = messageBuilder.where()
					.eq(SMMessageWrapper.COLUMN_MSG_ID, message.getOrgMsgId())
					.and()
					.eq(SMMessageWrapper.COLUMN_SEND_TIME, message.getTime())
					.queryForFirst();
			if (m != null) {
				map.put(m.getMsgId(), m);
			}
		}
		for (SMOrgMsgIdMap wrapper : list) {
			SMMessageWrapper sm = null;
			if ((sm = map.get(wrapper.getOrgMsgId())) != null) {
				wrapper.setMessage(sm);
				returnList.add(wrapper.createSMMessage());
			}
		}
		return filterSMMessageByUser(returnList);
	}

	// START V2
	/**
	 * 加载历史的个人消息
	 * 
	 * @param fromUsers
	 * @param toUsers
	 * @param startTime
	 * @param endTime
	 * @param count
	 * @param lastSendTime
	 * @return
	 * @throws Exception
	 */
	public List<SMMessage> loadUserMessages(List<Long> fromUsers,
			List<Long> toUsers, Long startTime, Long endTime, Integer count,
			Long lastSendTime) throws Exception {
		return loadUserMessages(fromUsers, toUsers, startTime, endTime, count, lastSendTime, false);
	}

	/**
	 * 加载历史的群消息
	 * 
	 * @param roomIds
	 * @param userId
	 *            显示群中该userid的消息
	 * @param startTime
	 * @param endTime
	 * @param count
	 * @param lastSendTime
	 * @param isShowSelfCompany
	 * @param allUserIds
	 * @return
	 * @throws Exception
	 */
	public List<SMMessage> loadRoomMessages(List<Long> roomIds, Long userId,
			Long startTime, Long endTime, Integer count, Long lastSendTime,
			boolean isShowSelfCompany, List<Long> allUserIds) throws Exception {
		return loadRoomMessages(roomIds, userId, startTime, endTime, count, lastSendTime, isShowSelfCompany, allUserIds, false);
	}
	
	public List<SMMessage> loadRoomMessages(List<Long> roomIds, Long userId,
			Long startTime, Long endTime, Integer count, Long lastSendTime,
			boolean isShowSelfCompany, List<Long> allUserIds, boolean filterOrg) throws Exception {
		if ((count == null || count == 0 || count > MAX_COUNT)
				|| (isShowSelfCompany && (allUserIds == null || allUserIds
						.size() == 0))) {
			return new ArrayList<SMMessage>(0);
		}
		confirmConnection();
		QueryBuilder<SMRoomMessageWrapper, Long> builder = roomMessageDao
				.queryBuilder();
		Where<SMRoomMessageWrapper, Long> where = builder.where();
		if (roomIds != null && roomIds.size() > 0) {
			if (roomIds.size() == 1) {
				if (roomIds.get(0) != 0) {
					where.eq(SMRoomMessageWrapper.COLUMN_ROOM_ID,
							roomIds.get(0));
				}
			} else {
				where.in(SMRoomMessageWrapper.COLUMN_ROOM_ID, roomIds.toArray());
			}
		}
		List<Long> userIds = new ArrayList<Long>();
		if (allUserIds != null) {
			userIds.addAll(allUserIds);
		}
		if (userId != null && userId != 0) {
			userIds.clear();
			userIds.add(userId);
		}
		if (userIds != null && userIds.size() > 0) {
			if (userIds.size() == 1) {
				if (userIds.get(0) != 0) {
					where.and();
					where.eq(SMRoomMessageWrapper.COLUMN_FROM_USER,
							userIds.get(0));
				}
			} else {
				where.and();
				where.in(SMRoomMessageWrapper.COLUMN_FROM_USER,
						userIds.toArray());
			}
		}
		if (startTime != null) {
			where.and();
			where.ge(SMRoomMessageWrapper.COLUMN_SEND_TIME, startTime);
		}
		if (endTime != null) {
			where.and();
			where.le(SMRoomMessageWrapper.COLUMN_SEND_TIME, endTime);
		}
		if (lastSendTime != null) {
			where.and();
			where.lt(SMRoomMessageWrapper.COLUMN_SEND_TIME, lastSendTime);
		}
		builder.orderBy(SMRoomMessageWrapper.COLUMN_SEND_TIME, false);
		if (count != null && count != 0) {
			builder.limit(count);
		}
		List<SMRoomMessageWrapper> list = builder.query();
		if (list == null || list.size() == 0)
			return new ArrayList<SMMessage>(0);
		List<SMMessage> returnList = new ArrayList<SMMessage>();
		Collections.reverse(list);
		for (SMRoomMessageWrapper wrapper : list) {
			returnList.add(wrapper.createSMMessage());
		}
		return filterSMMessageByUser(returnList, filterOrg);
	}
	// END V2
}

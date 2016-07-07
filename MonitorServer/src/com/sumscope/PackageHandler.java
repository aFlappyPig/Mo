package com.sumscope;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.google.protobuf.GeneratedMessage;
import com.sumscope.AccountServer.ReqGetMonitorInfo;
import com.sumscope.AccountServer.ReqNewLogin;
import com.sumscope.AccountServer.ResGetMonitorInfo;
import com.sumscope.AccountServer.ResNewLogin;
import com.sumscope.Gateway.Subscribe;
import com.sumscope.InfoServer.ISGetUserInfoReq;
import com.sumscope.InfoServer.ISGetUserInfoRsp;
import com.sumscope.InfoServer.ISReqAllCompanyMembers;
import com.sumscope.InfoServer.ISReqUserInfo;
import com.sumscope.InfoServer.ISResAllCompanyMembers;
import com.sumscope.InfoServer.ISResUserInfo;
import com.sumscope.Monitor.ALLUserInfoRes;
import com.sumscope.Monitor.AccountReq;
import com.sumscope.Monitor.AccountRes;
import com.sumscope.Monitor.AllUserInfoReq;
import com.sumscope.Monitor.ExportFileReq;
import com.sumscope.Monitor.ExportFileReqCommon;
import com.sumscope.Monitor.ExportFileRes;
import com.sumscope.Monitor.MessageReq;
import com.sumscope.Monitor.MessageReqByRoom;
import com.sumscope.Monitor.MessageReqByUser;
import com.sumscope.Monitor.MessageRes;
import com.sumscope.Monitor.MessageResCommon;
import com.sumscope.Monitor.SubscribeReq;
import com.sumscope.Monitor.SubscribeRes;
import com.sumscope.MsgExpress.ErrMessage;
import com.sumscope.SM.SMMessage;
import com.sumscope.message.FileDownloadService;
import com.sumscope.message.MessageService;

import databus.AppServer;
import databus.Package;

public class PackageHandler {

	AppServer databus;

	Map<Integer, Package> requestPackages = new ConcurrentHashMap<Integer, Package>();

	boolean isNewProtocal = true;

	public PackageHandler(AppServer databus) {
		this.databus = databus;
	}

	public void handleOnRequest(final Package pk) {
		GeneratedMessage body = null;
		if (pk.msg == null)
			return;
		System.out
				.println("request class:" + pk.msg.getClass().getSimpleName());
		if (pk.msg.getClass() == AccountReq.class) {
			// databus.PostRequest(ReqCreateMonitor.newBuilder()
			// .setUsername("peng.ye")
			// .setPassword("e10adc3949ba59abbe56e057f20f883e")
			// .setCompanyId("0085969c400146a780ea53615b4736ab").build());
			// create login
			AccountReq req = (AccountReq) pk.msg;
			ReqNewLogin.Builder builder = ReqNewLogin.newBuilder();
			builder.setLoginName(req.getAccount());
			builder.setPassword(req.getPassword()).setBMonitor(true);
			// body = builder.build();
			postMessageEx(builder.build(), pk,
					new RequestObjectListenerAdapter<ResNewLogin>() {

						@Override
						public void handleResponse(Package old,
								final ResNewLogin login) {
							postMessageEx(
									ReqGetMonitorInfo.newBuilder()
											.setAccountId(login.getId())
											.build(),
									old,
									new RequestObjectListenerAdapter<ResGetMonitorInfo>() {

										@Override
										public void handleResponse(Package old,
												ResGetMonitorInfo response) {
											// ResGetMonitorInfo info =
											// (ResGetMonitorInfo) resposne.msg;
											AccountRes msg = AccountRes
													.newBuilder()
													.setRet(login.getResult())
													.setToken(login.getToken())
													.setUserid(
															login.getUserid())
													.setCompanyid(
															response.getCompanyId())
													.setAccountid(login.getId())
													.build();
											databus.Reply(old, msg);
										}
									});
						}
					});
		} else if (pk.msg.getClass() == AllUserInfoReq.class) {
			AllUserInfoReq req = (AllUserInfoReq) pk.msg;
			// body = ISReqAllCompanyMembers.newBuilder()
			// .setCompanyId(req.getCompanyid()).build();
			postMessageEx(
					ISReqAllCompanyMembers.newBuilder()
							.setCompanyId(req.getCompanyid()).build(), pk,
					new RequestObjectListenerAdapter<ISResAllCompanyMembers>() {

						@Override
						public void handleResponse(Package old,
								ISResAllCompanyMembers members) {

							ISGetUserInfoReq.Builder builder = ISGetUserInfoReq
									.newBuilder().setReqDetail(true)
									.setOwnerId(0).setRemoveAvatar(true);
							for (int i = 0; i < members.getUseridsCount(); i++) {
								builder.addVersion(0);
								builder.addUserId(members.getUserids(i));
							}
							postMessageEx(
									builder.build(),
									old,
									new RequestObjectListenerAdapter<ISGetUserInfoRsp>() {

										@Override
										public void handleResponse(Package old,
												ISGetUserInfoRsp users) {
											ALLUserInfoRes.Builder builder = ALLUserInfoRes
													.newBuilder()
													.setErrorCode(
															users.getErrorCode());
											for (int i = 0; i < users
													.getUserInfoCount(); i++) {
												builder.addUserInfo(users
														.getUserInfo(i));
											}
											databus.Reply(old, builder.build());
										}
									});
						}
					});
		} else if (pk.msg.getClass() == ExportFileReq.class) {
			ExportFileReq fileReq = (ExportFileReq) pk.msg;
			MessageReq req = fileReq.getReq();
			FileDownloadService.getService().requestExportFile(this, req,
					new FileDownloadService.RequestListener<String>() {

						@Override
						public void onGetResult(String url) {
							databus.Reply(pk, ExportFileRes.newBuilder()
									.setResult(0).setUrl(url).build());
						}

						@Override
						public void onError() {
							databus.Reply(pk, ExportFileRes.newBuilder()
									.setResult(1).build());
						}
					});
		} else if (pk.msg.getClass() == ExportFileReqCommon.class) {
			ExportFileReqCommon fileReq = (ExportFileReqCommon) pk.msg;
			MessageReqByUser userReq = fileReq.getRequestUser() ? fileReq
					.getUserReq() : null;
			MessageReqByRoom roomReq = fileReq.getRequestUser() ? null
					: fileReq.getRoomReq();
			if (userReq == null && roomReq == null) {
				databus.Reply(pk, ExportFileRes.newBuilder().setResult(1)
						.build());
				return;
			}
			FileDownloadService.getService().requestExportFileEx(this, userReq,
					roomReq, new FileDownloadService.RequestListener<String>() {

						@Override
						public void onGetResult(String url) {
							databus.Reply(pk, ExportFileRes.newBuilder()
									.setResult(0).setUrl(url).build());
						}

						@Override
						public void onError() {
							databus.Reply(pk, ExportFileRes.newBuilder()
									.setResult(1).build());
						}
					});
		} else if (pk.msg.getClass() == MessageReq.class) {
			MessageReq req = (MessageReq) pk.msg;
			if (req.getUseridStartList().size() == 0
					&& req.getUseridEndCount() == 0)
				return;
			if (!req.getIsRoom()) {
				try {
					List<SMMessage> list = MessageService
							.getService()
							.loadMessage(
									req.getUseridStartList(),
									req.getUseridEndList(),
									(req.getStartTime() == null || req
											.getStartTime().trim().length() == 0) ? null
											: new SimpleDateFormat(
													"yyyy-MM-dd HH:mm:ss")
													.parse(req.getStartTime()
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
									req.getIsInclude(), req.getLastSendTime());
					MessageRes.Builder builder = MessageRes.newBuilder();
					for (int i = 0; i < list.size(); i++) {
						builder.addMessages(i, list.get(i));
					}
					databus.Reply(pk, builder.build());
				} catch (Exception e) {
					e.printStackTrace();
				}
				// }
			} else {
				try {
					List<SMMessage> list = MessageService
							.getService()
							.loadRoomMessage(
									req.getUseridStartList(),
									(req.getStartTime() == null || req
											.getStartTime().trim().length() == 0) ? null
											: new SimpleDateFormat(
													"yyyy-MM-dd HH:mm:ss")
													.parse(req.getStartTime()
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
					MessageRes.Builder builder = MessageRes.newBuilder();
					for (int i = 0; i < list.size(); i++) {
						builder.addMessages(i, list.get(i));
					}
					databus.Reply(pk, builder.build());
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		} else if (pk.msg.getClass() == MessageReqByUser.class) {
			MessageReqByUser userReq = (MessageReqByUser) pk.msg;
			try {
				List<SMMessage> list = MessageService
						.getService()
						.loadUserMessages(
								userReq.getUseridStartList(),
								userReq.getUseridEndList(),
								(userReq.getStartTime() == null || userReq
										.getStartTime().trim().length() == 0) ? null
										: new SimpleDateFormat(
												"yyyy-MM-dd HH:mm:ss").parse(
												userReq.getStartTime()
														+ " 00:00:00")
												.getTime(),
								(userReq.getEndTime() == null || userReq
										.getEndTime().trim().length() == 0) ? null
										: new SimpleDateFormat(
												"yyyy-MM-dd HH:mm:ss").parse(
												userReq.getEndTime()
														+ " 23:59:59")
												.getTime(),
								Math.abs(userReq.getCount()),
								userReq.getLastSendTime());
				MessageResCommon.Builder builder = MessageResCommon
						.newBuilder();
				for (int i = 0; i < list.size(); i++) {
					builder.addMessages(i, list.get(i));
				}
				databus.Reply(pk, builder.build());
			} catch (Exception e) {
				e.printStackTrace();
			}
		} else if (pk.msg.getClass() == MessageReqByRoom.class) {
			MessageReqByRoom roomReq = (MessageReqByRoom) pk.msg;
			try {
				List<SMMessage> list = MessageService
						.getService()
						.loadRoomMessages(
								roomReq.getRoomIdsList(),
								roomReq.getUserId(),
								(roomReq.getStartTime() == null || roomReq
										.getStartTime().trim().length() == 0) ? null
										: new SimpleDateFormat(
												"yyyy-MM-dd HH:mm:ss").parse(
												roomReq.getStartTime()
														+ " 00:00:00")
												.getTime(),
								(roomReq.getEndTime() == null || roomReq
										.getEndTime().trim().length() == 0) ? null
										: new SimpleDateFormat(
												"yyyy-MM-dd HH:mm:ss").parse(
												roomReq.getEndTime()
														+ " 23:59:59")
												.getTime(),
								Math.abs(roomReq.getCount()),
								roomReq.getLastSendTime(),
								roomReq.getIsShowSelfCompany(),
								roomReq.getAllUserIdsList());
				MessageResCommon.Builder builder = MessageResCommon
						.newBuilder();
				for (int i = 0; i < list.size(); i++) {
					builder.addMessages(i, list.get(i));
				}
				databus.Reply(pk, builder.build());
			} catch (Exception e) {
				e.printStackTrace();
			}
		} else if (pk.msg.getClass() == SubscribeReq.class) {
			SubscribeReq req = (SubscribeReq) pk.msg;
			Subscribe sub = req.getMonitorsb();
			int serialNum = databus.MulticastRequest(sub);
			SubscribeRes.Builder builder = SubscribeRes.newBuilder();
			if (serialNum > 0) {
				builder.setRet(0);
				System.out.println("subscribe serial number:" + serialNum);
				requestPackages.put(serialNum, pk);
			} else {
				builder.setRet(1);
			}
			databus.Reply(pk, builder.build());
		}
		if (body != null) {
			postMessage(body, pk);
		}
	}

	private void postMessage(GeneratedMessage body, Package pk) {
		// maybe lock
		int serial = databus.PostRequest(body);
		if (serial != 0) {
			System.out.println("post message serial:" + serial);
			requestPackages.put(serial, pk);
		} else {
			System.out.println("post request package failed");
		}
	}

	Map<Integer, DefaultRequestObjectListener> requestBinds = new ConcurrentHashMap<Integer, DefaultRequestObjectListener>();

	public void handleOnResponse(Package pk) {
		System.out.println("on response serial number:" + pk.header.serialNum);
		DefaultRequestObjectListener callback = requestBinds
				.remove(pk.header.serialNum);
		if (callback == null)
			return;
		callback.onResponse(pk.msg);
	}

	// public void handleOnResponse(Package pk) {
	// System.out.println("on response serial number:" + pk.header.serialNum);
	// Package old = requestPackages.remove(pk.header.serialNum);
	// if (old == null)
	// return;
	// System.out.println("on response class:"
	// + pk.msg.getClass().getSimpleName());
	// if (pk.msg.getClass() == ResNewLogin.class) {
	// ResNewLogin login = (ResNewLogin) pk.msg;
	// if (!isNewProtocal) {
	// AccountRes msg = AccountRes.newBuilder()
	// .setRet(login.getResult()).setToken(login.getToken())
	// .setUserid(login.getUserid())
	// .setCompanyid("0085969c400146a780ea53615b4736ab")
	// .build();
	// databus.Reply(old, msg);
	// } else {
	// Package resposne = databus
	// .SendRequest(ReqGetMonitorInfo.newBuilder()
	// .setAccountId(login.getId()).build(), 5000);
	// AccountRes msg;
	// if (resposne != null && databus.Parse(resposne)) {
	// ResGetMonitorInfo info = (ResGetMonitorInfo) resposne.msg;
	// msg = AccountRes.newBuilder().setRet(login.getResult())
	// .setToken(login.getToken())
	// .setUserid(login.getUserid())
	// .setCompanyid(info.getCompanyId())
	// .setAccountid(login.getId()).build();
	//
	// } else {
	// msg = AccountRes.newBuilder().setRet(1).setToken("")
	// .setUserid(0).setCompanyid("").build();
	// }
	// databus.Reply(old, msg);
	// }
	// } else if (pk.msg.getClass() == ISResAllCompanyMembers.class) {
	// ISResAllCompanyMembers members = (ISResAllCompanyMembers) pk.msg;
	// ISReqUserInfo.Builder builder = ISReqUserInfo.newBuilder()
	// .setOwnerId(0).setDetail(true);
	// for (int i = 0; i < members.getUseridsCount(); i++) {
	// builder.addVersion(0);
	// builder.addUserId(members.getUserids(i));
	// }
	// postMessage(builder.build(), old);
	// } else if (pk.msg.getClass() == ISResUserInfo.class) {
	// ISResUserInfo users = (ISResUserInfo) pk.msg;
	// ALLUserInfoRes.Builder builder = ALLUserInfoRes.newBuilder()
	// .setErrorCode(users.getRetcode());
	// for (int i = 0; i < users.getUserInfoCount(); i++) {
	// builder.addUserInfo(users.getUserInfo(i));
	// }
	// databus.Reply(old, builder.build());
	// } else if (pk.msg.getClass() == MSResMessage.class) {
	// MSResMessage res = (MSResMessage) pk.msg;
	// MessageRes.Builder builder = MessageRes.newBuilder();
	// for (int i = 0; i < res.getMsgCount(); i++) {
	// builder.addMessages(i, res.getMsg(i));
	// }
	// databus.Reply(old, builder.build());
	// } else if (pk.msg.getClass() == Gateway.SubscribeResult.class) {
	// SubscribeResult result = (SubscribeResult) pk.msg;
	// System.out.println("subscribe ret : " + result.getRet() + ", msg:"
	// + result.getMsg().toStringUtf8());
	// } else if (pk.msg.getClass() == ResCreateMonitor.class) {
	// ResCreateMonitor response = (ResCreateMonitor) pk.msg;
	// System.out.println("create monitor result:" + response.getResult());
	// }
	// }

	public void postMessageEx(GeneratedMessage body, Package pk,
			final RequestObjectListener callback) {
		int serial = databus.PostRequest(body);
		if (serial != 0) {
			requestBinds.put(serial, new DefaultRequestObjectListener(pk) {

				@Override
				public void handleResponse(Package old,
						GeneratedMessage response) {
					if (callback != null) {
						callback.handleResponse(old, response);
					}
				}

				@Override
				public void handleOnError(Package old, ErrMessage error) {
					if (callback != null) {
						callback.handleOnError(old, error);
					}
				}
			});
		}
	}

	public abstract class RequestObjectListenerAdapter<T extends GeneratedMessage>
			implements RequestObjectListener<T> {
		@Override
		public void handleOnError(Package old, ErrMessage error) {
			if (databus != null) {
				databus.Reply(old, error);
			}
		}
	}

	public static interface RequestObjectListener<T extends GeneratedMessage> {

		public void handleResponse(Package old, T response);

		public void handleOnError(Package old, ErrMessage error);
	}

	public static abstract class DefaultRequestObjectListener<T extends GeneratedMessage>
			implements RequestObjectListener<T> {

		public Package request;

		public DefaultRequestObjectListener() {
			this(null);
		}

		public DefaultRequestObjectListener(Package request) {
			this.request = request;
		}

		public void onResponse(T response) {
			if (response == null || response instanceof ErrMessage) {
				handleOnError(request, (ErrMessage) response);
				return;
			}
			handleResponse(request, response);
		}

		@Override
		public void handleOnError(Package old, ErrMessage error) {
			if (error != null) {
				System.out.println("error_code:" + error.getErrcode()
						+ ", error_msg:" + error.getErrmsg());
			}
		}
	}
}

(function($, window) {
	$.fn.Databus = function() {
		var ws = undefined;
		var serial = 65536;
		var protobufBuilders = {};
		var protobufClass = {};
		var ProtoBuf = dcodeIO.ProtoBuf;
		var ByteBuffer = dcodeIO.ByteBuffer;
		var ob = new window.observer();
		var pushDataFactory = undefined;
		var mIp, mPort, mPath;
		PREFIX_DATABUS = "DATABUS";
		var classFactory = {
			create : function(key) {
				var cls = this.classBuilder.build(key)
				if (cls == null) {
					console.log("Create " + key + " Failed...");
				}
				return cls;
			}
		};
		var builderFactory = {
			create : function(key) {
				return ProtoBuf.loadProtoFile("protobuf/" + key + ".proto");
			}
		};
		var databus = {
			close : function(){
				ws.close();
			},
			reconnect : function(options) {
				this.connect(mIp, mPort, mPath, options);
			},
			connect : function(ip, port, path, options) {
				if(ws != undefined) {
					ws.close();
					ws = undefined;
				}
				mIp = ip;
				mPort = port;
				mPath = path;
				var settings = {
					onConnectSuccess : undefined,
					onConnectError : undefined,
					onConnectClose : undefined
				};
				$.extend(settings, options);
				var location = "ws://" + ip + ":" + port + path;
				if (window.WebSocket) {
					ws = new WebSocket(location);
				} else if (window.MozWebSocket) {
					ws = new MozWebSocket(location);
				} else {
					console.log("No Support WebSocket...");
					return;
				}
				ws.binaryType = "arraybuffer";
				ws.onopen = function() {
					console.log("WebSocket Open Success, Ip:%s, Port:%s, Path:%s", ip, port, path);
					if (settings.onConnectSuccess != undefined) {
						settings.onConnectSuccess();
					}
				};
				var ref = this;
				ws.onmessage = function(evt) {
					if (typeof (evt.data) == "string") {
                        console.log("Receive String Data : " + evt.data);
					} else {
						var bb = ByteBuffer.wrap(evt.data, "binary");
						var pack = ref.builderClass("msgexpress", "MsgExpress.Pack").decode(bb);
						var header = pack.header;
						if (header.packageType == 3) {
                            var msg = ref.builderClass("msgexpress", "MsgExpress.PublishData").decode(pack.body);
							var topic = msg.topic;
							var content = [];
							var DataType = ref.builderClass("msgexpress", "MsgExpress.DataType");
							for (j = 0; j < msg.item.length; j++) {
								var item = msg.item[j];
								var key = item.key;
								var type = item.type;
								var value = item.value[0];
								if (type == DataType.STRING) {
									value = item.strVal[0];
								} else if (type == DataType.INT64) {
									value = item.lVal[0];
								} else if (type == DataType.UINT64) {
									value = item.ulVal[0];
								} else if (type == DataType.INT32) {
									value = item.iVal[0];
								} else if (type == DataType.UINT32) {
									value = item.uiVal[0];
								} else if (type == DataType.FLOAT) {
									value = item.fVal[0];
								} else if (type == DataType.DOUBLE) {
									value = item.fVal[0];
								} else if (type == DataType.DATETIME) {
									value = item.tVal[0];
								} else if (type == DataType.BINARY) {
									value = item.rawVal[0].toString("binary");
								}
								content.push({
									key : key,
									value : value
								});
							}
							if (pushDataFactory != undefined) {
								pushDataFactory(topic, content);
							}
						} else {
							var obj = undefined;
							var iserror = false;
							if (header.command == 0) {
								var errorClass = ref.builderClass("msgexpress", "MsgExpress.ErrMessage");
								obj = errorClass.decode(pack.body);
								iserror = true;
							} else {
								obj = pack.body;
							}
							ref.publishInfo(PREFIX_DATABUS, pack.header.serialnum, obj, iserror);
						}
					}
				};
				ws.onclose = function(event) {
					console.log("Client Notify WebSocket Has Closed...", event);
					if (settings.onConnectClose != null) {
						settings.onConnectClose();
					}
				};
			},
			requestOnce : function(cmd, proto_package, proto_request, proto_response, callback) {
				var builder;
				var callbacks = {
					fillRequest : function(request) {
						console.log("Please Override fillRequest...");
					},
					handleResponse : function(response) {
						console.log("Please Override handleResponse...");
					},
					handlerError : function(error) {
						console.log("Error Message, Code:" + error.errcode + ", Message:" + error.errmsg);
					},
					handleOnDisconnect : function() {
						console.log("connection is disconnect");
					}
				}
				$.extend(callbacks, callback);
				if ((builder = protobufBuilders[proto_package]) == undefined && (builder = ProtoBuf.loadProtoFile("protobuf/" + proto_package + ".proto")) != undefined) {
					protobufBuilders[proto_package] = builder;
				}
				var Request = this.builderClass(proto_package, proto_request);
				var response = this.builderClass(proto_package, proto_response);

				var request = new Request();
				callbacks.fillRequest(request);
				if(ws.readyState == WebSocket.OPEN) {
					this.sendmsg(cmd, request, proto_package, proto_response, callbacks, false);
				}else {
					callbacks.handleOnDisconnect();
				}
			},
			sendmsg : function(cmd, msg, proto_package, proto_response, callbacks, forever) {
				var data = msg.encode();
				var pack = this.builderObj("msgexpress", "MsgExpress.Pack");
				pack.body = data;
				pack.header = this.builderObj("msgexpress", "MsgExpress.Header");
				pack.header.packageType = 1;
				pack.header.serialnum = serial++;
				pack.header.command = cmd;
				var ref = this;
				if (forever == undefined || !forever) {
					this.subscribeInfo(PREFIX_DATABUS, pack.header.serialnum, function(info, iserror) {
						if(iserror == undefined || !iserror) {
							var responseClass = ref.builderClass(proto_package, proto_response);
							var obj = null;
							try{
								obj = responseClass.decode(info);
							}catch(e){
								console.log("Response Message Error, Package : " + proto_package + ", Response Message : " + proto_response);
								console.log("Call Stack : " + e.stack);
								//responseClass = ref.builderClass("msgexpress", "MsgExpress.ErrMessage");
								//callbacks.handlerError(responseClass.decode(info));
							}
							if(obj != null) {
								callbacks.handleResponse(obj);
							}
					    }else {
					        callbacks.handlerError(info);
					    }
					});
				}
				var bb = pack.encode();
				if (ws.readyState == WebSocket.OPEN) {
					ws.send(bb.toArrayBuffer());
				}
			},
			requestForever : function(proto_package, proto_request, proto_response, callback) {},
			factory : function(map, key, create) {
				var creates = {
					classBuilder : undefined,
					create : function(key) {
						return null;
					}
				};
				$.extend(creates, create);
				var obj;
				if ((obj = map[key]) == undefined && (obj = creates.create(key)) != undefined) {
					map[key] = obj;
				}
				return obj;
			},
			builderClass : function(proto_package, proto_class) {
				var builder = this.factory(protobufBuilders, proto_package, builderFactory);
				var f = $.extend({
					classBuilder : builder
				}, classFactory);
				var obj = this.factory(protobufClass, proto_class, f);
				return obj;
			},
			builderObj : function(proto_package, proto_class) {
				var obj = this.builderClass(proto_package, proto_class);
				return new obj();
			},
			subscribeInfo : function(prefix, id, callback) {
				var subId = ob.sub(prefix + id, function(info, extra) {
					callback(info, extra);
					ob.unsub(subId);
				});
			},
			publishInfo : function(prefix, id, info, extra) {
				ob.pub(prefix + id, info, extra);
			},
			contains : function(id) {
				return ob.contains(id);
			},
			setPushDataFactory : function(factory) {
				pushDataFactory = factory;
			},
			requestPublishData : function(topic, callbacks) {
				ob.sub(topic, function(args) {
					if (arguments.length == 1) {
						callbacks(args);
					} else {
						callbacks(arguments [0], arguments [1], arguments [2], arguments [3], arguments [4], arguments [5]);
					}
				});
			},
			notifyPublishData : function(topic, args) {
				if(arguments.length == 2) {
				    ob.pub(topic, args);
				}else {
					ob.pub(topic, arguments [1], arguments [2], arguments [3], arguments [4], arguments [5], arguments [6]);
				}
			}
		}
		return databus;
	};
})(jQuery, window);
if(window.top.databus == undefined) {
	window.top.databus = new $.fn.Databus();
}
window.databus = window.top.databus;
package com.sumscope;

import java.io.File;

import databus.*;
import databus.Package;

public class MonitorServer extends AppServer {

	PackageHandler handler = new PackageHandler(this);
	
	static {
		System.setProperty("java.util.Arrays.useLegacyMergeSort", "true");
	}

	public MonitorServer() {
	}

	public void OnRequest(Package p) {
		// System.out.println("DatabusClient.OnRequest:" + p.msg.toString());
		// Reply(p, p.msg);
		handler.handleOnRequest(p);
	}

	public void OnResponse(Package p) {
		// System.out.println("DatabusClient.OnResponse:" + p.msg.toString());
		handler.handleOnResponse(p);
	}

	public void OnPublish(Package p) {
		// System.out.println("DatabusClient.OnResponse:" + p.msg.toString());
	}

	public void OnEvent(int eventId) {
		System.out.println("DatabusClient.OnEvent:eventId=" + eventId);
	}

	public void OnPackage(Package p) {
		boolean ok = Parse(p);
		System.out.println("receive package, command:" + p.header.command
				+ ", type:" + p.header.type + ",serail:" + p.header.serialNum
				+ ",parseok:" + ok);
		if (ok) {
			// System.out.println("OnPackage:"+p.toString());
			if (p.header.type == PackageHeader.REQUEST) {
				OnRequest(p);
			} else if (p.header.type == PackageHeader.RESPONSE) {
				OnResponse(p);
			} else if (p.header.type == PackageHeader.PUBLISH) {
				OnPublish(p);
			}

		} else
			System.out.println("Parse error");
	}

	public int Initialize() {
		int ret = Start();
		return ret;
	}

	public void Release() {
		Stop();
	}

	public static void main(String[] args) {
		System.out.println("MonitorServer init");
		String usrdir = System.getProperty("user.dir");
		String binPath = usrdir + File.separator + "xbin" + File.separator
				+ "x64";
		AppConfiguration.GetInstance().SetBinPath(binPath);// your
		// c++
		// library
		// path
		String configPath = usrdir + File.separator + "config";
		AppConfiguration.GetInstance().SetConfigPath(configPath);
		MonitorServer client = new MonitorServer();
		client.Initialize();
	}
}

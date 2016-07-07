package databus; 

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.ByteBuffer;

import com.google.protobuf.ByteString;
import com.google.protobuf.GeneratedMessage;
import com.sumscope.Storage;

public class AppServer implements Runnable{ 
	private boolean stop = false;
	private int id = -1;
	
	private native int CreateServer();
	private native int Initialize(int id, String configpath, String configfile);
	private native boolean Release(int id);
	private native boolean PostMsg(int id, Package msg);
	private native boolean SendMsg(int id, Package request, Package response, int msTimeout);
	private native boolean Reply(int id, PackageHeader header, byte[] data);
	private native boolean GetPackage(int id, Package p);
	private native boolean QueryData(int id, Package request, Package response);
	private native void GetLastError(int id, ErrMessage errmsg);

	public native String GetClazz(int cmd, int type);
	public native int GetCommand(String clazz, int type, int appId);
	
	public AppServer() {}
	
	public static void addDir(String s) {
	     try {  
	         Field field = ClassLoader.class.getDeclaredField("usr_paths");  
	         field.setAccessible(true);  
	         String[] paths = (String[])field.get(null);  
	         for (int i = 0; i < paths.length; i++) {  
	            if (s.equals(paths[i])) {  
	              return;  
	             }  
	         }  
	         String[] tmp = new String[paths.length+1];  
	         System.arraycopy(paths, 0, tmp, 0, paths.length);  
	         tmp[paths.length] = s;  
	         field.set(null,tmp);  
	    } catch (IllegalAccessException e) {  
	       System.out.println(e.toString());
	    }catch (NoSuchFieldException e) {  
	    	System.out.println(e.toString());
	    }
	}
	
	private void loadLibrary() { 
		String path = System.getProperty("user.dir");
		System.out.println("path:" + path);
		
		String binpath = AppConfiguration.GetInstance().GetBinPath();
		System.out.println("bin path:"+binpath);
		addDir(binpath);
        String arch = System.getProperty("os.arch").trim();
        String osname  =System.getProperty("os.name").trim();
        System.out.println(osname + ":" + arch);
        if (osname.equals("Linux")) {
          	System.loadLibrary("msgexpress");
        } else {
        	if (arch.equals("x86")) {
		        System.load(binpath + "/log4cxx.dll"); 
		        System.load(binpath + "/zlibwapi.dll"); 
		        System.load(binpath + "/msgexpress.dll"); 
        	} else {
		        System.load(binpath + "/log4cxx64.dll"); 
		        System.load(binpath + "/zlibwapi64.dll"); 
		        System.load(binpath + "/msgexpress64.dll"); 
        	}
        }
	}
	
	private GeneratedMessage getMsg(String clazz,byte[] data) {
		if (clazz.isEmpty()) {
			return null;
		}
    	String className = clazz.replace(".", "$");
    	className = "com.sumscope." + className;
		Method m;
		try {
			Class<?> c = Class.forName(className);
			m = c.getMethod("parseFrom", new Class[]{byte[].class});
			GeneratedMessage msg = (GeneratedMessage) m.invoke(c, new Object[]{data});
			return msg;
		} catch (Exception e) {
			e.printStackTrace();
		} 
		return null;
	}
	
	public boolean Parse(Package p) {
	    if (p.header.type == 0) {
	    	return false;
	    }
	    if (p.extData != null) {
	    	ByteBuffer buff = ByteBuffer.wrap(p.extData);
	    	short size = buff.getShort();
	    	byte nameSize = buff.get();
	    	byte[] dst = new byte[nameSize];
	    	buff.get(dst, 0, nameSize);
	    	String clazz = new String(dst);
	    	byte[] data = new byte[size - 3 - nameSize];
	    	buff.get(data, 0, size - 3 - nameSize);
	    	p.extMsg = getMsg(clazz,data);
	    }
		String clazz = GetClazz(p.header.command, p.header.type);
		p.msg = getMsg(clazz, p.data);
		return true;
	}
	
	private int getCommand(GeneratedMessage msg) {
		String clazz = msg.getClass().getName();
		int index = clazz.lastIndexOf(".");
		String subStr = clazz.substring(index + 1);
		String className = subStr.replace("$", ".");
		return GetCommand(className, PackageHeader.REQUEST, -1);
	}
	
	public int Start() {
		loadLibrary();
		id = CreateServer();
		int ret = Initialize(id, AppConfiguration.GetInstance().GetConfigPath(), "clientcfg.xml");
		if (ret == 0) {
		    Thread t = new Thread(this);
		    t.start();
		}
		return ret;
	}
	
	public boolean Stop() {
		stop = true;
		return Release(id);
	}
	
	public ErrMessage GetLastError() {
		ErrMessage err = new ErrMessage();
		GetLastError(id, err);
		return err;
	}
	
	public void run() {
		while (!stop) {
			Package p = new Package();
		    if (GetPackage(id, p)) {
		    	OnPackage(p);
		    }
		}
	}
	
	public void OnPackage(Package p) {}
	
	public int PostRequest(GeneratedMessage msg) {
		Package pack = new Package();
		pack.header.type = PackageHeader.REQUEST;
		pack.header.command = getCommand(msg);
		pack.data = msg.toByteArray();
    	if (PostMsg(id, pack)) {
    		return pack.header.serialNum;
    	}
    	return 0;
	}
	
	public int MulticastRequest(GeneratedMessage msg) {
		Package pack = new Package();
		pack.header.type = PackageHeader.REQUEST;
		pack.header.command = getCommand(msg);
		pack.header.multicast = 1;
		pack.data = msg.toByteArray();
    	if (PostMsg(id, pack)) {
    		return pack.header.serialNum;
    	}
    	return 0;
	}
	
	public int PostPackage(PackageHeader header, byte[] body, GeneratedMessage extMsg) {
		Package pack = new Package();
		pack.header = header;
		pack.data = body;
		if (extMsg != null) {
			ByteString bs = extMsg.toByteString();
			int size = bs.size();
			String name = extMsg.getDescriptorForType().getFullName();
			short total = (short)(size + name.length() + 3);
			ByteBuffer buff = ByteBuffer.allocate(total);
			buff.putShort(total);
			buff.put((byte)name.length());
			buff.put(name.getBytes());
			buff.put(bs.toByteArray());
			pack.extData = buff.array();
		}
    	if (PostMsg(id, pack)) {
    		return pack.header.serialNum;
    	}
    	return 0;
	}
	
	public boolean Publish(GeneratedMessage pubData) {
		Package pack = new Package();
		pack.header.type = PackageHeader.PUBLISH;
		pack.data = pubData.toByteArray();
    	return PostMsg(id, pack);
	}
	
	public Package SendRequest(GeneratedMessage request, int msTimeout) {
		Package pack = new Package();
		pack.header.type = PackageHeader.REQUEST;
		pack.header.command = getCommand(request);
		pack.data = request.toByteArray();
		Package resp = new Package();
		if (SendMsg(id, pack, resp, msTimeout)) {
			Parse(resp);
		}
		return resp;
	}
	
	public boolean Reply(Package request, com.google.protobuf.GeneratedMessage msg) {
	    return Reply(id, request.header, msg.toByteArray());
	}
	
	public Storage.QueryDataResponse QueryData(Storage.QueryDataRequest request) {
		Package pack = new Package();
		pack.header.type = PackageHeader.REQUEST;
		pack.header.command = getCommand(request);
		pack.data = request.toByteArray();
		Package resp = new Package();
		if (QueryData(id, pack, resp)) {
			resp.header.type = PackageHeader.RESPONSE;
			resp.header.command = getCommand(request);
			Parse(resp);
		}
		return (Storage.QueryDataResponse)resp.msg;
	}
}
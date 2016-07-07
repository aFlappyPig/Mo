package databus;

public class PackageHeader implements Cloneable {
	public static final byte REQUEST = 1;
	public static final byte RESPONSE = 2;
	public static final byte PUBLISH = 3;
	
    public int version;
    public int type;
    public int serialNum;
    public int command;
    public int srcaddr;
    public int dstaddr;
    public int multicast;
}
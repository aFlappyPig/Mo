package databus;
import com.google.protobuf.GeneratedMessage;

public class Package {
    public PackageHeader header = new PackageHeader();
    public byte[] data;
    public byte[] extData;
    public GeneratedMessage msg;
    public GeneratedMessage extMsg;
}
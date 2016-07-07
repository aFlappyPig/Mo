package databus;

public class Utilities {
	public static byte[] int2Bytes(int num) {  
        byte[] byteNum = new byte[4];  
        for (int ix = 0; ix < 4; ++ix) {  
            int offset = 32 - (ix + 1) * 8;  
            byteNum[ix] = (byte) ((num >> offset) & 0xff);  
        }  
        return byteNum;  
    }  
  
    public static int bytes2Int(byte[] byteNum) {  
        int num = 0;  
        for (int ix = 0; ix < 4; ++ix) {  
            num <<= 8;  
            num |= (byteNum[ix] & 0xff);  
        }  
        return num;  
    }  
    
    public static byte[] long2Bytes(long num) {  
        byte[] byteNum = new byte[8];  
        for (int ix = 0; ix < 8; ++ix) {  
            int offset = 64 - (ix + 1) * 8;  
            byteNum[ix] = (byte) ((num >> offset) & 0xff);  
        }  
        return byteNum;  
    }  
      
    public static long bytes2Long(byte[] byteNum) {  
        long num = 0;  
        for (int ix = 0; ix < 8; ++ix) {  
            num <<= 8;  
            num |= (byteNum[ix] & 0xff);  
        }  
        return num;  
    }
    
    public static byte[] float2Bytes(float f) {  
        int fbit = Float.floatToIntBits(f);  
          
        byte[] b = new byte[4];    
        for (int i = 0; i < 4; i++) {    
            b[i] = (byte) (fbit >> (24 - i * 8));    
        }
        int len = b.length;
        byte[] dest = new byte[len];
        System.arraycopy(b, 0, dest, 0, len);  
        byte temp;
        for (int i = 0; i < len / 2; ++i) {  
            temp = dest[i];  
            dest[i] = dest[len - i - 1];  
            dest[len - i - 1] = temp;  
        }
        return dest;
    }
    
    public static float bytes2Float(byte[] b) {    
        int l;                                             
        l = b[ 0];                                  
        l &= 0xff;                                         
        l |= ((long) b[1] << 8);                   
        l &= 0xffff;                                       
        l |= ((long) b[2] << 16);                  
        l &= 0xffffff;                                     
        l |= ((long) b[3] << 24);                  
        return Float.intBitsToFloat(l);                    
    }
    
    public static byte[] double2Bytes(double data) {  
        long intBits = Double.doubleToLongBits(data);  
        return long2Bytes(intBits);  
    }
    
    public static double bytes2Double(byte[] bytes) {  
        long l = bytes2Long(bytes);   
        return Double.longBitsToDouble(l);  
    }  
}
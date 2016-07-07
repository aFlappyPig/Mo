package databus;

public class AppConfiguration {
	private static  AppConfiguration instance = null;
	private String filePath = "";
	private String configPath = "";
	public void SetBinPath(String path) {
	    filePath=path;
	}
	public String GetBinPath() {
		return filePath;
	}
	public void SetConfigPath(String path) {
		configPath=path;
	}
	public String GetConfigPath() {
		return configPath;
	}
	private AppConfiguration() {}
	public static synchronized AppConfiguration GetInstance() {
		if(instance == null) {
			instance=new AppConfiguration();
		}
		return instance;
	}
}
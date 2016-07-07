package databus; 

public interface ClientIntf {
    void OnEvent(int eventId);
    void OnRequest(Package p);
	void OnResponse(Package p);
	void OnPublish(Package p);
}
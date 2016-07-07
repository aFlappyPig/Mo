package com.sumscope.account;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.sumscope.util.MD5;

public class MemoryAccountService implements AccountInterface{
	
	Map<String, String> accounts = new ConcurrentHashMap<String, String>(){
		{
			try{
			    put("peng.ye", MD5.getMD5("123456".getBytes("UTF-8")));
			    
			}catch(Exception e) {
			}
		}
	};
	

	@Override
	public boolean verifyAccount(String account, String password) {
		return true;
	}

}

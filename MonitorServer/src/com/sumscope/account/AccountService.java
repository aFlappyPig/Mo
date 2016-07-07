package com.sumscope.account;


public class AccountService implements AccountInterface{
	
	AccountInterface service = new MemoryAccountService();

	@Override
	public boolean verifyAccount(String account, String password) {
		return service.verifyAccount(account, password);
	}
}

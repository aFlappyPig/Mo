package com.sumscope;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


public class DownloadFileServlet extends HttpServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		doPost(req, resp);
	}

	private boolean isEmpty(String s) {
		return s == null || s.trim().length() == 0;
	}

	private void onError(HttpServletRequest request,
			HttpServletResponse response) {
		try {
			response.sendError(HttpServletResponse.SC_NOT_FOUND);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	@Override
	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		String fileName = request.getParameter("name");
		String fileUrl = request.getParameter("url");
		if (isEmpty(fileName) || isEmpty(fileUrl)) {
			onError(request, response);
			return;
		}
		fileName = new String(fileName.getBytes("ISO-8859-1"), "UTF-8");
		fileName = java.net.URLEncoder.encode(fileName, "UTF-8");
		response.addHeader("Content-Disposition", "attachment; filename="
				+ fileName);
		URL url = new URL(fileUrl);
		HttpURLConnection rulConnection = (HttpURLConnection) url
				.openConnection();
		rulConnection.setDoInput(true);
		rulConnection.setDoOutput(true);
		try {
			rulConnection.connect();
			byte[] buffer = new byte[1024];
			InputStream in = rulConnection.getInputStream();
			int n = -1;
			while ((n = in.read(buffer)) > 0) {
				response.getOutputStream().write(buffer, 0, n);
			}
		} catch (Exception e) {
			onError(request, response);
			e.printStackTrace();
		}
	}
}

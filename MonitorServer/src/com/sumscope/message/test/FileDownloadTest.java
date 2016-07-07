package com.sumscope.message.test;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import com.sumscope.SM.SMMessage;
import com.sumscope.message.FileDownloadService;
import com.sumscope.message.MessageService;
import com.sumscope.message.ZipCompressor;
import com.sumscope.message.model.ExcelWriterUnit;

public class FileDownloadTest {

	@BeforeClass
	public static void setUpBeforeClass() throws Exception {
	}

	@AfterClass
	public static void tearDownAfterClass() throws Exception {
	}

	@Before
	public void setUp() throws Exception {

	}

	@After
	public void tearDown() throws Exception {
	}

	public void requestRoomMessage() {

		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Date d = new java.util.Date();
		try {
			Long startTime = sdf.parse("2016-3-11 00:00:00").getTime();
			Long endTime = sdf.parse("2016-3-11 23:59:59").getTime();
			List<SMMessage> list = MessageService.getService()
					.loadRoomMessages(new ArrayList<Long>() {
						{
							add(1000000086L);
						}
					}, null, startTime, endTime, 200,
							System.currentTimeMillis(), false, null);
			for (SMMessage message : list) {
				d.setTime(message.getTime());
				System.out.println("time:" + sdf.format(d) + ",id:"
						+ message.getId() + ",fromUserId:"
						+ message.getHeader().getFrom());
			}
			System.out.println("list size:" + list.size());
		} catch (Exception e) {
			e.printStackTrace();
		}

	}

	public void requestUserMessage() {
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Date d = new java.util.Date();
		try {
			Long startTime = sdf.parse("2015-2-1 00:00:00").getTime();
			Long endTime = sdf.parse("2016-3-10 23:59:59").getTime();
			List<SMMessage> list = MessageService.getService()
					.loadUserMessages(new ArrayList<Long>() {
						{
							add(10004837L);
						}
					}, new ArrayList<Long>(), startTime, endTime, 50,
							System.currentTimeMillis());
			for (SMMessage message : list) {
				d.setTime(message.getTime());
				System.out.println("time:" + sdf.format(d) + ",id:"
						+ message.getId() + ",fromUserId:"
						+ message.getHeader().getFrom());
			}
			System.out.println("list size:" + list.size());
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@Test
	public void test() {
		generatePDF();
		// requestUserMessage();
		// requestRoomMessage();
		// ExcelWriterUnit.loadAllFaceFile();
		// sortData();
		// byte[] buffer = new byte[] { (byte) 0, (byte) 0, (byte) 8, (byte) 9,
		// (byte) 18, (byte) 15, (byte) 73, (byte) 110, (byte) 118,
		// (byte) 97, (byte) 108, (byte) 105, (byte) 100, (byte) 32,
		// (byte) 82, (byte) 101, (byte) 113, (byte) 117, (byte) 101 };
		// try {
		// // ResLogin login = AccountServer.ResLogin.parseFrom(buffer);
		// ErrMessage msg = ErrMessage.parseFrom(buffer);
		// } catch (InvalidProtocolBufferException e) {
		// e.printStackTrace();
		// }
		// MessageReq req = MessageReq.newBuilder()
		// .setCount(-40)
		// .setEndTime(null)
		// .setIsInclude(true)
		// .setIsRoom(false)
		// .setLastSendTime(System.currentTimeMillis())
		// .setSequenceId(0)
		// .setStartTime(null)
		// .addUseridStart(10004837L)
		// .setToken("")
		// .build();
		// SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		// Date d = new java.util.Date();
		// try {
		// // int count = 0;
		// // while(true) {
		// Long startTime = sdf.parse("2016-3-10 00:00:00").getTime();
		// Long endTime = sdf.parse("2016-3-10 23:59:59").getTime();
		// // List<SMMessage> list = MessageService.getService().loadMessage(
		// // new ArrayList<Long>() {
		// // {
		// // add(10004837L);
		// // }
		// // }, new ArrayList<Long>(), startTime, endTime, null, 200,
		// // true, System.currentTimeMillis());
		// long[] als = new long[] { 10004837L };
		// List<SMMessage> list = MessageService.getService().loadOrgMessage(
		// new ArrayList<Long>() {
		// {
		// add(10004837L);
		// }
		// }, startTime, endTime, 50, System.currentTimeMillis());
		// for (SMMessage message : list) {
		// d.setTime(message.getTime());
		// System.out.println("time:" + sdf.format(d) + ",id:"
		// + message.getId() + ",fromUserId:"
		// + message.getHeader().getFrom());
		// }
		// System.out.println("list size:" + list.size());
		// // count++;
		// // System.out.println("load message count(byte)"+count);
		// // Thread.currentThread().sleep(5000L);
		// // }
		// } catch (Exception e) {
		// // TODO Auto-generated catch block
		// e.printStackTrace();
		// }
		// long[] times = new long[]{1447402464192L,1457539547358L};
		// for(long t : times) {
		// d.setTime(t);
		// System.out.println("result time:"+sdf.format(d));
		// }
	}
	
	public void generatePDF() {
		File file = new File("C:\\Users\\peng.ye\\Desktop\\test.pdf");
		List<ExcelWriterUnit> units = new ArrayList<ExcelWriterUnit>() {
			{

				ExcelWriterUnit unit = new ExcelWriterUnit();
				unit.setTime("2015-06-07");
				unit.setFromUser("叶鹏");
				unit.setToUser("崔卫海");
				unit.setContent("我去大放送萨芬阿双方阿斯蒂芬阿双方撒，暗室逢灯阿范德萨发双方的都是\nasdfasfsafsd");
				unit.setBackup("文字");
				add(unit);
			}
		};
		try {
			FileDownloadService.writerFile(file, units);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void sortData() {
		Integer[] a = new Integer[] { 10, 8, 6, 4, 2, 0 };
		Integer[] b = new Integer[] { 9, 7, 5, 3, 1 };
		List<Integer> list1 = Arrays.asList(a);
		Collections.reverse(list1);
		List<Integer> list2 = Arrays.asList(b);
		Collections.reverse(list2);
		List<Integer> list = new ArrayList<Integer>();
		list.addAll(list1);
		list.addAll(list2);
		Collections.sort(list, new Comparator<Integer>() {

			@Override
			public int compare(Integer o1, Integer o2) {
				if (o1 == o2) {
					return 0;
				}
				return o1 > o2 ? -1 : 1;
			}
		});
		List<Integer> subList = list.subList(0, 5);
		Collections.reverse(subList);
		System.out.println(Arrays.toString(subList.toArray()));
	}

	public void compressFile() {
		final String path = "D:\\pye\\Document\\Java\\nginx\\nginx-1.8.0\\download\\";

		// File dir = new File(path, "test");
		ZipCompressor compress = new ZipCompressor(new File(path, "1.zip"));
		// compress.compress(dir);
		compress.compress(new ArrayList<File>() {
			{
				File file1 = new File(path, "1.txt");
				File file2 = new File(path, "2.txt");
				add(file1);
				add(file2);
			}
		});
	}
}

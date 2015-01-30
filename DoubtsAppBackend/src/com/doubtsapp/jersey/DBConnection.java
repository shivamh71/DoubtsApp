package com.doubtsapp.jersey;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class DBConnection {

	// Method to create DB connection
	@SuppressWarnings("finally")
	public static Connection createConnection() throws Exception {
		Connection con = null;
		try {
			Class.forName(GlobalVariables.dbClass);
			con = DriverManager.getConnection(GlobalVariables.dbUrl,
					GlobalVariables.dbUser, GlobalVariables.dbPwd);
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		} finally {
			return con;
		}
	}
	
	

}

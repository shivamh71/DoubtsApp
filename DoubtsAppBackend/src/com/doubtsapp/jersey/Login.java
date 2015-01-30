package com.doubtsapp.jersey;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

@Path("/login")
public class Login {

	@GET
	@Path("/dologin")
	@Produces(MediaType.APPLICATION_JSON)
	public String login(@QueryParam("uname") String userName,
			@QueryParam("pass") String password) throws JSONException {
		userName = userName.trim().toLowerCase();
		password = password.trim().toLowerCase();
		JSONObject response = new JSONObject();
		if (checkUserLogin(userName, password)) {
			response.put("login", "success");
			response.put("status", true);
		} else {
			response.put("login", "failed");
			response.put("status", false);
		}
		System.out.println(response.toString());
		return response.toString();
	}

	public boolean checkUserLogin(String userName, String password) {
		Connection dbConn = null;
		Statement stmt = null;
		String query = "SELECT * FROM USERS WHERE USERNAME='" + userName
				+ "' AND PASSWORD = '" + password + "';";
		try {
			dbConn = DBConnection.createConnection();
			stmt = dbConn.createStatement();
			ResultSet rs = stmt.executeQuery(query);
			boolean toReturn = rs.next();
			dbConn.close();
			return toReturn;
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return false;
	}

}

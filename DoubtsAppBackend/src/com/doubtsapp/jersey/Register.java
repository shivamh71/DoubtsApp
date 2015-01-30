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

@Path("/register")
public class Register {

	@GET
	@Path("/doregister")
	@Produces(MediaType.APPLICATION_JSON)
	public String register(@QueryParam("uname") String userName,
			@QueryParam("pass") String password,
			@QueryParam("name") String name, @QueryParam("email") String email,
			@QueryParam("role") String role) throws JSONException {
		userName = userName.trim().toLowerCase();
		password = password.trim().toLowerCase();
		name = name.trim().toLowerCase();
		email = email.trim().toLowerCase();
		role = role.trim().toLowerCase();
		JSONObject response = new JSONObject();
		System.out.println(response.toString());
		if (!checkIfUserExists(userName)) {
			registerUser(userName, password, name, email, role);
			response.put("register", "success");
			response.put("status", true);
		} else {
			response.put("register", "failed");
			response.put("status", false);
		}
		System.out.println(response.toString());
		return response.toString();
	}

	public boolean checkIfUserExists(String userName) {
		Connection dbConn = null;
		Statement stmt = null;
		String query = "SELECT * FROM USERS WHERE USERNAME='" + userName + "';";
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

	public void registerUser(String userName, String password, String name,
			String email, String role) {
		Connection dbConn = null;
		Statement stmt = null;
		String query = "INSERT INTO USERS VALUES ('" + userName + "','"
				+ password + "','" + name + "','" + email + "','" + role + "');";
		System.out.println(query);
		try {
			dbConn = DBConnection.createConnection();
			stmt = dbConn.createStatement();
			stmt.executeUpdate(query);
			dbConn.close();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}

package com.doubtsapp.jersey;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import com.mysql.fabric.xmlrpc.base.Array;

@Path("/mycourses")
public class MyCourses {

	@GET
	@Path("/courselist")
	@Produces(MediaType.APPLICATION_JSON)
	public String getCourses(@QueryParam("uname") String username, @QueryParam("role") String role) throws Exception {
		JSONObject response = new JSONObject();
		Connection dbConn = DBConnection.createConnection();
		Statement stmt = dbConn.createStatement();
		
		String query = "SELECT COURSECODE FROM ENROLLMENT WHERE USERNAME='" + username + "' AND ROLE='" + role + "';";
		ResultSet rs = stmt.executeQuery(query);
		ArrayList<String> requestList = new ArrayList<String>();
		ArrayList<String> codeList = new ArrayList<String>();
		while (rs.next()) {
			codeList.add(rs.getString("COURSECODE"));
		}
		for(String code : codeList){
			Statement stmt2 = dbConn.createStatement();
			ResultSet rs2 = stmt2.executeQuery("SELECT COURSENAME, INSTRUCTORNAME FROM COURSES WHERE COURSECODE='" + code + "';");
			while(rs2.next()){
				requestList.add(code + ":" + rs2.getString("COURSENAME") + ":" + rs2.getString("INSTRUCTORNAME"));
			}
		}
		response.put("status", true);
		response.put("requests", requestList);
		dbConn.close();
		return response.toString();
	}

}

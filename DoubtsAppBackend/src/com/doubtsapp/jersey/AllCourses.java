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

@Path("/allcourses")
public class AllCourses {

	@GET
	@Path("/courselist")
	@Produces(MediaType.APPLICATION_JSON)
	public String getCourses() throws Exception {
		JSONObject response = new JSONObject();
		Connection dbConn = DBConnection.createConnection();
		Statement stmt = dbConn.createStatement();
		String query = "SELECT COURSECODE, COURSENAME, INSTRUCTORNAME FROM COURSES;";
		ResultSet rs = stmt.executeQuery(query);
		ArrayList<String> requestList = new ArrayList<String>();
		while (rs.next()) {
			String code = rs.getString("COURSECODE");
			String name = rs.getString("COURSENAME");
			String instructor = rs.getString("INSTRUCTORNAME");
			requestList.add(code + ":" + name + ":" + instructor);
		}
		response.put("status", true);
		response.put("requests", requestList);
		dbConn.close();
		return response.toString();
	}

}

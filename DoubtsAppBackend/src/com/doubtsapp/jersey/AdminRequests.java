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

@Path("/admin")
public class AdminRequests {

	@GET
	@Path("/requests")
	@Produces(MediaType.APPLICATION_JSON)
	public String login() throws Exception {
		JSONObject response = new JSONObject();
		Connection dbConn = DBConnection.createConnection();
		Statement stmt = dbConn.createStatement();
		String query = "SELECT * FROM ADMIN_REQUESTS;";
		
		ResultSet rs = stmt.executeQuery(query);
		ArrayList<String> requestList = new ArrayList<String>();
		while (rs.next()) {
			String username = rs.getString("USERNAME");
			String name = rs.getString("NAME");
			requestList.add(username + ":" + name);
		}
		response.put("status", true);
		for(String s : requestList){
			System.out.println(s);
		}
		response.put("requests", requestList);
		JSONArray requestLis = response.getJSONArray("requests");
		for(int i=0;i<requestLis.length();i++){
			System.out.println(requestLis.getString(i));
		}
		return response.toString();
	}

}

package com.doubtsapp.frontend;

import android.support.v7.app.ActionBarActivity;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Intent;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import org.apache.http.Header;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONException;
import org.json.JSONObject;

import com.loopj.android.http.AsyncHttpClient;
import com.loopj.android.http.AsyncHttpResponseHandler;
import com.loopj.android.http.RequestParams;

/*
 * 	Login Activity Class
 * 
 */
public class RegisterActivity extends ActionBarActivity {

	EditText userName; // Object for user name field
	EditText password; // Object for password field
	EditText name; // Object for name field
	EditText email; // Object for email field
	Spinner spinner; // Object for user mode field
	Intent intent; // Object to change page

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_register);
		userName = (EditText) findViewById(R.id.registerUsername);
		password = (EditText) findViewById(R.id.registerPassword);
		name = (EditText) findViewById(R.id.registerName);
		email = (EditText) findViewById(R.id.registerEmail);
		spinner = (Spinner) findViewById(R.id.userModes);
		String[] modes = new String[] { "STUDENT", "INSTRUCTOR" };
		ArrayAdapter<String> adapter = new ArrayAdapter<String>(this,
				android.R.layout.simple_spinner_item, modes);
		spinner.setAdapter(adapter);
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.login, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle action bar item clicks here. The action bar will
		// automatically handle clicks on the Home/Up button, so long
		// as you specify a parent activity in AndroidManifest.xml.
		int id = item.getItemId();
		if (id == R.id.action_settings) {
			return true;
		}
		return super.onOptionsItemSelected(item);
	}

	public void registerUser(View view) {
		String uname = userName.getText().toString();
		String pass = password.getText().toString();
		String fullName = name.getText().toString();
		String emailId = email.getText().toString();
		String mode = spinner.getSelectedItem().toString();
		RequestParams params = new RequestParams();
		if (uname.trim() == "" || pass.trim() == "" || fullName.trim() == ""
				|| emailId.trim() == "") {
			Toast.makeText(getApplicationContext(), "Fill up the empty fields",
					Toast.LENGTH_LONG).show();
		} else {
			params.put("uname", uname);
			params.put("pass", pass);
			params.put("name", fullName);
			params.put("email", emailId);
			params.put("role", mode);
			intent = new Intent(this, LoginActivity.class);
			invokeWS(params);
		}
	}

	public void invokeWS(RequestParams params) {
		AsyncHttpClient client = new AsyncHttpClient();
		client.get(
				"http://10.13.7.44:8082/DoubtsAppBackend/register/doregister/",
				params, new AsyncHttpResponseHandler() {
					@Override
					public void onSuccess(String response) {
						try {
							JSONObject obj = new JSONObject(response);
							if (obj.getBoolean("status")) {
								Toast.makeText(getApplicationContext(),
										"You are successfully Registered!",
										Toast.LENGTH_LONG).show();
								startActivityForResult(intent, 1);
							} else {
								Toast.makeText(getApplicationContext(),
										"Registration Failed",
										Toast.LENGTH_LONG).show();
							}
						} catch (JSONException e) {
							Toast.makeText(
									getApplicationContext(),
									"Error Occured [Server's JSON response might be invalid]!",
									Toast.LENGTH_LONG).show();
							e.printStackTrace();
						}
					}

					@Override
					public void onFailure(int statusCode, Throwable error,
							String content) {
						if (statusCode == 404) {
							Toast.makeText(getApplicationContext(),
									"Requested resource not found",
									Toast.LENGTH_LONG).show();
						} else if (statusCode == 500) {
							Toast.makeText(getApplicationContext(),
									"Something went wrong at server end",
									Toast.LENGTH_LONG).show();
						} else {
							Toast.makeText(
									getApplicationContext(),
									"Unexpected Error occcured! [Most common Error: Device might not be connected to Internet or remote server is not up and running]",
									Toast.LENGTH_LONG).show();
						}
					}
				});
	}

}

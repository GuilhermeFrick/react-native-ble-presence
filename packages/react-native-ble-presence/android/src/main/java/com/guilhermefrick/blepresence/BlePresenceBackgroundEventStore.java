package com.guilhermefrick.blepresence;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

final class BlePresenceBackgroundEventStore {
  private static final String PREFERENCES = "ble_presence_background_monitor";
  private static final String EVENTS = "pending_events";
  private static final int MAX_EVENTS = 100;

  private BlePresenceBackgroundEventStore() {}

  static synchronized void add(Context context, JSONObject event) {
    SharedPreferences preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
    JSONArray current = readArray(preferences.getString(EVENTS, "[]"));
    JSONArray next = new JSONArray();
    next.put(event);

    for (int index = 0; index < current.length() && next.length() < MAX_EVENTS; index += 1) {
      try {
        next.put(current.getJSONObject(index));
      } catch (JSONException ignored) {
        // Ignore malformed historical entries.
      }
    }

    preferences.edit().putString(EVENTS, next.toString()).apply();
  }

  static synchronized List<JSONObject> drain(Context context) {
    SharedPreferences preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
    JSONArray current = readArray(preferences.getString(EVENTS, "[]"));
    List<JSONObject> events = new ArrayList<>();

    for (int index = 0; index < current.length(); index += 1) {
      try {
        events.add(current.getJSONObject(index));
      } catch (JSONException ignored) {
        // Ignore malformed historical entries.
      }
    }

    preferences.edit().remove(EVENTS).apply();
    return events;
  }

  private static JSONArray readArray(String value) {
    try {
      return new JSONArray(value);
    } catch (JSONException ignored) {
      return new JSONArray();
    }
  }
}

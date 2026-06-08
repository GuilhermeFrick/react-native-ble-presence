package com.guilhermefrick.blepresence;

import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanRecord;
import android.bluetooth.le.ScanResult;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.ParcelUuid;
import android.util.Base64;
import android.util.SparseArray;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public final class BlePresenceBackgroundReceiver extends BroadcastReceiver {
  static final String ACTION = "com.guilhermefrick.blepresence.BACKGROUND_SCAN";

  @Override
  public void onReceive(Context context, Intent intent) {
    if (!ACTION.equals(intent.getAction())) {
      return;
    }

    int callbackType = intent.getIntExtra(BluetoothLeScanner.EXTRA_CALLBACK_TYPE, 0);
    int errorCode = intent.getIntExtra(BluetoothLeScanner.EXTRA_ERROR_CODE, 0);

    if (errorCode != 0) {
      dispatch(context, errorEvent(errorCode));
      return;
    }

    ArrayList<ScanResult> results = intent.getParcelableArrayListExtra(BluetoothLeScanner.EXTRA_LIST_SCAN_RESULT);

    if (results == null) {
      return;
    }

    for (ScanResult result : results) {
      dispatch(context, scanEvent(result, callbackType));
    }
  }

  private static void dispatch(Context context, JSONObject event) {
    if (!BlePresenceBackgroundMonitorModule.emitIfListening(event)) {
      BlePresenceBackgroundEventStore.add(context, event);
    }
  }

  private static JSONObject errorEvent(int errorCode) {
    JSONObject event = baseEvent("error");
    put(event, "message", "Android background BLE scan error: " + errorCode);
    return event;
  }

  private static JSONObject scanEvent(ScanResult result, int callbackType) {
    String eventType = callbackType == 4 ? "exited" : "entered";
    JSONObject event = baseEvent(eventType);
    JSONObject scanResult = new JSONObject();
    ScanRecord record = result.getScanRecord();
    String address = result.getDevice().getAddress();

    put(scanResult, "id", address);
    put(scanResult, "platform", "android");
    put(scanResult, "rssi", result.getRssi());
    put(scanResult, "macAddress", address);
    put(scanResult, "seenAt", Instant.now().toString());

    if (record != null) {
      put(scanResult, "localName", record.getDeviceName());
      put(scanResult, "manufacturerData", firstManufacturerData(record.getManufacturerSpecificData()));
      put(scanResult, "serviceUuids", serviceUuids(record.getServiceUuids()));
    }

    put(event, "scanResult", scanResult);
    return event;
  }

  private static JSONObject baseEvent(String type) {
    JSONObject event = new JSONObject();
    put(event, "id", UUID.randomUUID().toString());
    put(event, "type", type);
    put(event, "platform", "android");
    put(event, "occurredAt", Instant.now().toString());
    return event;
  }

  private static String firstManufacturerData(SparseArray<byte[]> manufacturerData) {
    if (manufacturerData == null || manufacturerData.size() == 0) {
      return null;
    }

    int companyId = manufacturerData.keyAt(0);
    byte[] payload = manufacturerData.valueAt(0);
    byte[] value = new byte[payload.length + 2];
    value[0] = (byte) (companyId & 0xff);
    value[1] = (byte) ((companyId >> 8) & 0xff);
    System.arraycopy(payload, 0, value, 2, payload.length);
    return Base64.encodeToString(value, Base64.NO_WRAP);
  }

  private static JSONArray serviceUuids(List<ParcelUuid> uuids) {
    if (uuids == null) {
      return null;
    }

    JSONArray values = new JSONArray();
    for (ParcelUuid uuid : uuids) {
      values.put(uuid.toString());
    }
    return values;
  }

  private static void put(JSONObject object, String key, Object value) {
    if (value == null) {
      return;
    }

    try {
      object.put(key, value);
    } catch (JSONException ignored) {
      // Skip fields that cannot be serialized.
    }
  }
}

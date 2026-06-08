package com.guilhermefrick.blepresence;

import android.app.PendingIntent;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.ParcelUuid;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import java.lang.ref.WeakReference;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.json.JSONObject;

public final class BlePresenceBackgroundMonitorModule extends ReactContextBaseJavaModule {
  private static final String EVENT_NAME = "BlePresenceBackgroundEvent";
  private static WeakReference<BlePresenceBackgroundMonitorModule> activeModule = new WeakReference<>(null);
  private int listenerCount = 0;

  BlePresenceBackgroundMonitorModule(ReactApplicationContext reactContext) {
    super(reactContext);
    activeModule = new WeakReference<>(this);
  }

  @Override
  public String getName() {
    return "BlePresenceBackgroundMonitor";
  }

  @ReactMethod
  public void isAvailable(Promise promise) {
    promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && scanner() != null);
  }

  @ReactMethod
  public void startMonitoring(ReadableMap options, Promise promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.reject("unsupported_android_version", "Background PendingIntent scan requires Android 8 or newer.");
      return;
    }

    BluetoothLeScanner scanner = scanner();
    if (scanner == null) {
      promise.reject("bluetooth_unavailable", "Bluetooth LE scanner is unavailable.");
      return;
    }

    try {
      List<ScanFilter> filters = buildFilters(options.getArray("filters"));
      ScanSettings settings = new ScanSettings.Builder()
        .setScanMode(ScanSettings.SCAN_MODE_LOW_POWER)
        .setCallbackType(ScanSettings.CALLBACK_TYPE_FIRST_MATCH | ScanSettings.CALLBACK_TYPE_MATCH_LOST)
        .setMatchMode(ScanSettings.MATCH_MODE_AGGRESSIVE)
        .build();
      int result = scanner.startScan(filters, settings, callbackIntent());

      if (result != 0) {
        promise.reject("scan_start_failed", "Android background scan failed with code " + result + ".");
        return;
      }

      promise.resolve(null);
    } catch (SecurityException error) {
      promise.reject("permission_denied", error);
    } catch (RuntimeException error) {
      promise.reject("scan_start_failed", error);
    }
  }

  @ReactMethod
  public void stopMonitoring(Promise promise) {
    BluetoothLeScanner scanner = scanner();

    if (scanner == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.resolve(null);
      return;
    }

    try {
      scanner.stopScan(callbackIntent());
      promise.resolve(null);
    } catch (SecurityException error) {
      promise.reject("permission_denied", error);
    }
  }

  @ReactMethod
  public void getPendingEvents(Promise promise) {
    WritableArray events = Arguments.createArray();
    for (JSONObject event : BlePresenceBackgroundEventStore.drain(getReactApplicationContext())) {
      events.pushMap(jsonToMap(event));
    }
    promise.resolve(events);
  }

  @ReactMethod
  public void addListener(String eventName) {
    listenerCount += 1;
  }

  @ReactMethod
  public void removeListeners(double count) {
    listenerCount = Math.max(0, listenerCount - (int) count);
  }

  static boolean emitIfListening(JSONObject event) {
    BlePresenceBackgroundMonitorModule module = activeModule.get();
    if (module == null || module.listenerCount == 0 || !module.getReactApplicationContext().hasActiveReactInstance()) {
      return false;
    }

    module.getReactApplicationContext()
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(EVENT_NAME, jsonToMap(event));
    return true;
  }

  private BluetoothLeScanner scanner() {
    BluetoothManager manager = (BluetoothManager) getReactApplicationContext()
      .getSystemService(Context.BLUETOOTH_SERVICE);
    BluetoothAdapter adapter = manager == null ? null : manager.getAdapter();
    return adapter == null ? null : adapter.getBluetoothLeScanner();
  }

  private PendingIntent callbackIntent() {
    Intent intent = new Intent(getReactApplicationContext(), BlePresenceBackgroundReceiver.class)
      .setAction(BlePresenceBackgroundReceiver.ACTION);
    return PendingIntent.getBroadcast(
      getReactApplicationContext(),
      7421,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
    );
  }

  private List<ScanFilter> buildFilters(ReadableArray rawFilters) {
    List<ScanFilter> filters = new ArrayList<>();
    if (rawFilters == null) {
      return filters;
    }

    for (int index = 0; index < rawFilters.size(); index += 1) {
      ReadableMap filter = rawFilters.getMap(index);
      if (filter == null) {
        continue;
      }

      String type = filter.getString("type");
      if ("ibeacon".equals(type)) {
        filters.add(buildIBeaconFilter(filter));
      } else if ("service_uuid".equals(type)) {
        filters.add(new ScanFilter.Builder()
          .setServiceUuid(ParcelUuid.fromString(filter.getString("serviceUuid")))
          .build());
      }
    }
    return filters;
  }

  private ScanFilter buildIBeaconFilter(ReadableMap filter) {
    byte[] uuid = uuidBytes(filter.getString("uuid"));
    int length = 18 + (filter.hasKey("major") ? 2 : 0) + (filter.hasKey("minor") ? 2 : 0);
    ByteBuffer data = ByteBuffer.allocate(length);
    data.put((byte) 0x02);
    data.put((byte) 0x15);
    data.put(uuid);

    if (filter.hasKey("major")) {
      data.putShort((short) filter.getInt("major"));
    }
    if (filter.hasKey("minor")) {
      data.putShort((short) filter.getInt("minor"));
    }

    byte[] mask = new byte[length];
    java.util.Arrays.fill(mask, (byte) 0xff);
    return new ScanFilter.Builder()
      .setManufacturerData(0x004c, data.array(), mask)
      .build();
  }

  private static byte[] uuidBytes(String value) {
    UUID uuid = UUID.fromString(value);
    return ByteBuffer.allocate(16)
      .putLong(uuid.getMostSignificantBits())
      .putLong(uuid.getLeastSignificantBits())
      .array();
  }

  private static WritableMap jsonToMap(JSONObject object) {
    return Arguments.makeNativeMap(objectToMap(object));
  }

  @SuppressWarnings("unchecked")
  private static java.util.Map<String, Object> objectToMap(JSONObject object) {
    java.util.Map<String, Object> map = new java.util.HashMap<>();
    java.util.Iterator<String> keys = object.keys();
    while (keys.hasNext()) {
      String key = keys.next();
      Object value = object.opt(key);
      if (value instanceof JSONObject) {
        map.put(key, objectToMap((JSONObject) value));
      } else if (value instanceof org.json.JSONArray) {
        map.put(key, arrayToList((org.json.JSONArray) value));
      } else if (value != JSONObject.NULL) {
        map.put(key, value);
      }
    }
    return map;
  }

  private static List<Object> arrayToList(org.json.JSONArray array) {
    List<Object> values = new ArrayList<>();
    for (int index = 0; index < array.length(); index += 1) {
      Object value = array.opt(index);
      if (value instanceof JSONObject) {
        values.add(objectToMap((JSONObject) value));
      } else if (value instanceof org.json.JSONArray) {
        values.add(arrayToList((org.json.JSONArray) value));
      } else if (value != JSONObject.NULL) {
        values.add(value);
      }
    }
    return values;
  }
}

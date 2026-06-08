#import <CoreLocation/CoreLocation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface BlePresenceBackgroundMonitor : RCTEventEmitter <RCTBridgeModule, CLLocationManagerDelegate>
@end

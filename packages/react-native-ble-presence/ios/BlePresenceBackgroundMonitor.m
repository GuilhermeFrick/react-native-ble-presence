#import "BlePresenceBackgroundMonitor.h"

static NSString *const BlePresenceEventName = @"BlePresenceBackgroundEvent";
static NSString *const BlePresenceRegionPrefix = @"ble-presence:";
static NSString *const BlePresencePendingEventsKey = @"ble-presence-background-pending-events";

@interface BlePresenceBackgroundMonitor ()
@property(nonatomic, strong) CLLocationManager *locationManager;
@property(nonatomic, assign) BOOL hasListeners;
@end

@implementation BlePresenceBackgroundMonitor

RCT_EXPORT_MODULE(BlePresenceBackgroundMonitor)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _locationManager = [CLLocationManager new];
    _locationManager.delegate = self;
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ BlePresenceEventName ];
}

- (void)startObserving
{
  self.hasListeners = YES;
}

- (void)stopObserving
{
  self.hasListeners = NO;
}

RCT_REMAP_METHOD(isAvailable,
                 isAvailableWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(@([CLLocationManager isMonitoringAvailableForClass:[CLBeaconRegion class]]));
}

RCT_REMAP_METHOD(startMonitoring,
                 startMonitoringWithOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSArray *filters = options[@"filters"];

  if (![filters isKindOfClass:[NSArray class]] || filters.count == 0) {
    reject(@"invalid_filters", @"At least one iBeacon filter is required.", nil);
    return;
  }

  NSUInteger addedRegions = 0;
  for (NSDictionary *filter in filters) {
    if (![filter[@"type"] isEqualToString:@"ibeacon"]) {
      continue;
    }

    CLBeaconRegion *region = [self regionForFilter:filter];
    if (region == nil) {
      continue;
    }

    region.notifyOnEntry = YES;
    region.notifyOnExit = YES;
    region.notifyEntryStateOnDisplay = YES;
    [self.locationManager startMonitoringForRegion:region];
    addedRegions += 1;
  }

  if (addedRegions == 0) {
    reject(@"unsupported_filters", @"iOS background monitoring currently supports iBeacon filters only.", nil);
    return;
  }

  resolve(nil);
}

RCT_REMAP_METHOD(stopMonitoring,
                 stopMonitoringWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  for (CLRegion *region in self.locationManager.monitoredRegions) {
    if ([region.identifier hasPrefix:BlePresenceRegionPrefix]) {
      [self.locationManager stopMonitoringForRegion:region];
    }
  }
  resolve(nil);
}

RCT_REMAP_METHOD(getPendingEvents,
                 getPendingEventsWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSUserDefaults *defaults = NSUserDefaults.standardUserDefaults;
  NSArray *events = [defaults arrayForKey:BlePresencePendingEventsKey] ?: @[];
  [defaults removeObjectForKey:BlePresencePendingEventsKey];
  resolve(events);
}

- (void)locationManager:(CLLocationManager *)manager didEnterRegion:(CLRegion *)region
{
  [self dispatchEvent:[self eventWithType:@"entered" region:region message:nil]];
}

- (void)locationManager:(CLLocationManager *)manager didExitRegion:(CLRegion *)region
{
  [self dispatchEvent:[self eventWithType:@"exited" region:region message:nil]];
}

- (void)locationManager:(CLLocationManager *)manager
  monitoringDidFailForRegion:(CLRegion *)region
  withError:(NSError *)error
{
  [self dispatchEvent:[self eventWithType:@"error" region:region message:error.localizedDescription]];
}

- (CLBeaconRegion *)regionForFilter:(NSDictionary *)filter
{
  NSString *filterId = filter[@"id"];
  NSString *uuidValue = filter[@"uuid"];
  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:uuidValue];

  if (filterId.length == 0 || uuid == nil) {
    return nil;
  }

  NSString *identifier = [BlePresenceRegionPrefix stringByAppendingString:filterId];
  NSNumber *major = filter[@"major"];
  NSNumber *minor = filter[@"minor"];

  if (major != nil && minor != nil) {
    return [[CLBeaconRegion alloc] initWithUUID:uuid
                                         major:major.unsignedShortValue
                                         minor:minor.unsignedShortValue
                                    identifier:identifier];
  }

  if (major != nil) {
    return [[CLBeaconRegion alloc] initWithUUID:uuid
                                         major:major.unsignedShortValue
                                    identifier:identifier];
  }

  return [[CLBeaconRegion alloc] initWithUUID:uuid identifier:identifier];
}

- (NSDictionary *)eventWithType:(NSString *)type
                         region:(CLRegion *)region
                        message:(NSString *)message
{
  NSMutableDictionary *event = [@{
    @"id" : NSUUID.UUID.UUIDString,
    @"type" : type,
    @"platform" : @"ios",
    @"occurredAt" : [self isoTimestamp]
  } mutableCopy];

  if ([region.identifier hasPrefix:BlePresenceRegionPrefix]) {
    event[@"filterId"] = [region.identifier substringFromIndex:BlePresenceRegionPrefix.length];
  }
  if (message != nil) {
    event[@"message"] = message;
  }
  return event;
}

- (void)dispatchEvent:(NSDictionary *)event
{
  if (self.hasListeners && self.bridge != nil) {
    [self sendEventWithName:BlePresenceEventName body:event];
    return;
  }

  NSUserDefaults *defaults = NSUserDefaults.standardUserDefaults;
  NSArray *current = [defaults arrayForKey:BlePresencePendingEventsKey] ?: @[];
  NSMutableArray *next = [NSMutableArray arrayWithObject:event];
  [next addObjectsFromArray:[current subarrayWithRange:NSMakeRange(0, MIN(current.count, 99))]];
  [defaults setObject:next forKey:BlePresencePendingEventsKey];
}

- (NSString *)isoTimestamp
{
  NSISO8601DateFormatter *formatter = [NSISO8601DateFormatter new];
  return [formatter stringFromDate:NSDate.date];
}

@end

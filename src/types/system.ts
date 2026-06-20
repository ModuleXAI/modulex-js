/**
 * Types for the System timezone endpoints.
 * @module types/system
 */

/** A single selectable timezone option. */
export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

/** A group of timezones under a region heading. */
export interface TimezoneGroup {
  region: string;
  timezones: TimezoneOption[];
}

/** Response from `GET /system/timezones`. */
export interface TimezoneListResponse {
  popular: TimezoneGroup[];
  all_timezones: string[];
}

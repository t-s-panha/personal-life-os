import assert from "node:assert";
import { test, describe } from "node:test";
import {
  getZonedDateString,
  getZonedStartOfDay,
  getZonedEndOfDay,
  isSameZonedDay,
  DEFAULT_OFFSET_MINUTES,
} from "../src/lib/timezone";

describe("Timezone Safety & Boundary Tests (Asia/Phnom_Penh UTC+07:00)", () => {
  test("00:05 Asia/Phnom_Penh (17:05 UTC prev day) evaluates to correct Cambodian date", () => {
    // 2026-08-08 00:05 in Phnom Penh (UTC+7) = 2026-08-07 17:05:00 UTC
    const utcTimestamp = new Date(Date.UTC(2026, 7, 7, 17, 5, 0));
    
    const zonedDateStr = getZonedDateString(utcTimestamp, DEFAULT_OFFSET_MINUTES);
    assert.strictEqual(zonedDateStr, "2026-08-08");

    const startOfDay = getZonedStartOfDay(utcTimestamp, DEFAULT_OFFSET_MINUTES);
    // Start of day in UTC should be 2026-08-07 17:00:00 UTC (00:00 Phnom Penh)
    assert.strictEqual(startOfDay.toISOString(), "2026-08-07T17:00:00.000Z");
  });

  test("23:55 Asia/Phnom_Penh (16:55 UTC) evaluates to correct Cambodian date", () => {
    // 2026-08-08 23:55 in Phnom Penh (UTC+7) = 2026-08-08 16:55:00 UTC
    const utcTimestamp = new Date(Date.UTC(2026, 7, 8, 16, 55, 0));
    
    const zonedDateStr = getZonedDateString(utcTimestamp, DEFAULT_OFFSET_MINUTES);
    assert.strictEqual(zonedDateStr, "2026-08-08");

    const endOfDay = getZonedEndOfDay(utcTimestamp, DEFAULT_OFFSET_MINUTES);
    // End of day in UTC should be 2026-08-08 16:59:59.999 UTC (23:59:59.999 Phnom Penh)
    assert.strictEqual(endOfDay.toISOString(), "2026-08-08T16:59:59.999Z");
  });

  test("Cross-midnight boundary 23:50 -> 00:20 correctly detects day transition", () => {
    // Session start: 2026-08-07 23:50 Phnom Penh = 2026-08-07 16:50 UTC
    const startUtc = new Date(Date.UTC(2026, 7, 7, 16, 50, 0));
    
    // Session end: 2026-08-08 00:20 Phnom Penh = 2026-08-07 17:20 UTC
    const endUtc = new Date(Date.UTC(2026, 7, 7, 17, 20, 0));

    assert.strictEqual(getZonedDateString(startUtc, DEFAULT_OFFSET_MINUTES), "2026-08-07");
    assert.strictEqual(getZonedDateString(endUtc, DEFAULT_OFFSET_MINUTES), "2026-08-08");
    assert.strictEqual(isSameZonedDay(startUtc, endUtc, DEFAULT_OFFSET_MINUTES), false);
  });
});

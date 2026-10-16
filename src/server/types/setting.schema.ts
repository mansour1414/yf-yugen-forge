import { z } from 'zod';

export const SETTING_GROUPS = ['GENERAL', 'SEO', 'SOCIAL', 'CONTACT', 'INTEGRATION'] as const;
export const SETTING_TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'] as const;

export const SettingGroupEnum = z.enum(SETTING_GROUPS);
export const SettingTypeEnum = z.enum(SETTING_TYPES);

const BulkSettingItemSchema = z.object({
  key: z.string().trim().min(1),
  value: z.any(),
  description: z.string().trim().optional(),
  group: SettingGroupEnum.optional(),
  isPublic: z.boolean().optional(),
});

/**
 * Two accepted shapes:
 *  1. `{ settings: [{ key, value, group?, isPublic?, description? }, ...] }` — what the admin
 *     panel sends. It is unwrapped here into the plain array, because SettingService.bulkUpdate()
 *     treats a plain object as a `{ key: value }` map. Previously this wrapper object was passed
 *     through untouched, so the service saved a single setting literally named "settings" instead
 *     of the individual keys.
 *  2. A plain `{ key: value, ... }` map.
 *
 * The wrapped form MUST be listed first: the record branch matches any object, so with the
 * opposite order it would swallow the wrapped form. The record branch also rejects a "settings"
 * key so a malformed wrapped payload fails validation (400) instead of silently being saved as a
 * setting named "settings".
 */
export const BulkUpdateSettingsSchema = z.union([
  z.object({ settings: z.array(BulkSettingItemSchema) }).transform((value) => value.settings),
  z.record(z.string(), z.any()).refine((value) => !('settings' in value), 'Malformed "settings" payload'),
]);

export const GroupUpdateSettingsSchema = z.record(z.string(), z.any());

export type BulkUpdateSettingsInput = z.infer<typeof BulkUpdateSettingsSchema>;
export type GroupUpdateSettingsInput = z.infer<typeof GroupUpdateSettingsSchema>;

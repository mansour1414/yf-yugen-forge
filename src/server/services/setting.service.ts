import { prisma } from '../../lib/prisma';
import { ApiError } from '../core/errors/api-error';
import { logActivity } from '../core/logger/activity.logger';
import { SETTING_GROUPS } from '../types/setting.schema';
import { isSafeHttpUrl } from '../utils/safe-url.util';

// Settings whose name ends in _url / _image hold a link or image URL that the public site renders
// into an <a href> or <img src> (social_*_url, seo_canonical_url, seo_image, seo_og_image, ...).
// A value like `javascript:...` saved there would run in a visitor's browser, and any admin with
// `settings.update` can write it, so only absolute http(s) URLs (or an empty value) are accepted.
const URL_SETTING_KEY = /(_url|_image)$/;

function assertSafeUrlSettings(items: Array<{ key: string; value: any }>) {
  for (const { key, value } of items) {
    if (!URL_SETTING_KEY.test(key)) continue;
    if (value === '' || value === null || value === undefined) continue;
    if (typeof value !== 'string' || !isSafeHttpUrl(value)) {
      throw ApiError.badRequest(`Setting "${key}" must be an absolute http(s) URL`);
    }
  }
}

function normalizeGroup(group: string): string {
  const upperGroup = group.toUpperCase();
  if (!(SETTING_GROUPS as readonly string[]).includes(upperGroup)) {
    throw ApiError.badRequest('Invalid settings group');
  }
  return upperGroup;
}

export class SettingService {
  private static formatSettingValue(value: string, type: string) {
    if (value === null || value === undefined) return value;
    switch (type) {
      case 'NUMBER':
        return Number(value);
      case 'BOOLEAN':
        return value === 'true' || value === '1' || value === (true as any);
      case 'JSON':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      case 'STRING':
      default:
        return value;
    }
  }

  private static serializeValue(value: any, type: string): string {
    if (value === null || value === undefined) return '';
    if (type === 'JSON') {
      return typeof value === 'string' ? value : JSON.stringify(value);
    }
    return String(value);
  }

  static async findAll() {
    const settings = await prisma.setting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
    return settings.map((s) => ({
      ...s,
      parsedValue: this.formatSettingValue(s.value, s.type),
    }));
  }

  static async findPublic() {
    const settings = await prisma.setting.findMany({
      where: { isPublic: true },
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
    return settings.map((s) => ({
      ...s,
      parsedValue: this.formatSettingValue(s.value, s.type),
    }));
  }

  static async findByGroup(group: string) {
    const upperGroup = normalizeGroup(group);
    const settings = await prisma.setting.findMany({
      where: { group: upperGroup as any },
      orderBy: { key: 'asc' },
    });
    return settings.map((s) => ({
      ...s,
      parsedValue: this.formatSettingValue(s.value, s.type),
    }));
  }

  static async bulkUpdate(updates: Record<string, any> | Array<{ key: string; value: any; description?: string; group?: string; isPublic?: boolean }>, userId: string, ipAddress?: string) {
    const updateList: Array<{ key: string; value: any; description?: string; group?: string; isPublic?: boolean }> = Array.isArray(updates)
      ? updates
      : Object.entries(updates).map(([key, value]) => ({ key, value }));

    if (updateList.length === 0) return [];

    assertSafeUrlSettings(updateList);

    // Single round-trip to fetch all existing settings instead of one query per item (N+1 fix)
    const existingSettings = await prisma.setting.findMany({
      where: { key: { in: updateList.map((item) => item.key) } },
    });
    const existingByKey = new Map(existingSettings.map((s) => [s.key, s]));

    const operations = updateList.map((item) => {
      const existing = existingByKey.get(item.key);
      if (!existing) {
        const inferredType = typeof item.value === 'boolean' ? 'BOOLEAN' : typeof item.value === 'number' ? 'NUMBER' : typeof item.value === 'object' ? 'JSON' : 'STRING';
        const serialized = this.serializeValue(item.value, inferredType);
        return prisma.setting.create({
          data: { key: item.key, value: serialized, type: inferredType, group: (item.group as any) || 'GENERAL', description: item.description || null, isPublic: item.isPublic ?? false },
        });
      }
      const serialized = this.serializeValue(item.value, existing.type);
      return prisma.setting.update({
        where: { key: item.key },
        data: { value: serialized, ...(item.description !== undefined && { description: item.description }), ...(item.isPublic !== undefined && { isPublic: item.isPublic }) },
      });
    });

    // All writes run in a single transaction instead of sequentially awaited in a loop
    const updatedSettings = await prisma.$transaction(operations);

    await logActivity({
      action: 'UPDATE',
      entity: 'SETTINGS',
      entityId: 'bulk-update',
      userId,
      ipAddress,
    });

    return updatedSettings.map((s) => ({
      ...s,
      parsedValue: this.formatSettingValue(s.value, s.type),
    }));
  }

  static async updateGroup(group: string, updates: Record<string, any>, userId: string, ipAddress?: string) {
    const upperGroup = normalizeGroup(group);
    const updateList = Object.entries(updates).map(([key, value]) => ({ key, value }));

    if (updateList.length === 0) return [];

    assertSafeUrlSettings(updateList);

    // Single round-trip to fetch all existing settings instead of one query per item (N+1 fix)
    const existingSettings = await prisma.setting.findMany({
      where: { key: { in: updateList.map((item) => item.key) } },
    });
    const existingByKey = new Map(existingSettings.map((s) => [s.key, s]));

    const operations = updateList.map((item) => {
      const existing = existingByKey.get(item.key);
      if (existing) {
        const serialized = this.serializeValue(item.value, existing.type);
        return prisma.setting.update({
          where: { key: item.key },
          data: { value: serialized, group: upperGroup as any },
        });
      }
      const inferredType = typeof item.value === 'boolean' ? 'BOOLEAN' : typeof item.value === 'number' ? 'NUMBER' : typeof item.value === 'object' ? 'JSON' : 'STRING';
      const serialized = this.serializeValue(item.value, inferredType);
      return prisma.setting.create({
        data: { key: item.key, value: serialized, type: inferredType, group: upperGroup as any },
      });
    });

    // All writes run in a single transaction instead of sequentially awaited in a loop
    const updatedSettings = await prisma.$transaction(operations);

    await logActivity({
      action: 'UPDATE',
      entity: 'SETTINGS_GROUP',
      entityId: upperGroup,
      userId,
      ipAddress,
    });

    return updatedSettings.map((s) => ({
      ...s,
      parsedValue: this.formatSettingValue(s.value, s.type),
    }));
  }
}

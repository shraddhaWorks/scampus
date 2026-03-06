import { Redis as UpstashRedis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const client =
  url && token
    ? new UpstashRedis({ url, token })
    : null;

/**
 * Redis client for caching. Uses Upstash REST API.
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env
 */
export const redis = {
  async get<T = unknown>(key: string): Promise<T | null> {
    if (!client) return null;
    try {
      const raw = await client.get(key);
      if (raw === null || raw === undefined) return null;
      if (typeof raw === "string" && (raw.startsWith("[") || raw.startsWith("{"))) {
        return JSON.parse(raw) as T;
      }
      return raw as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
    if (!client) return;
    try {
      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);
      if (options?.ex != null) {
        await client.set(key, serialized, { ex: options.ex });
      } else {
        await client.set(key, serialized);
      }
    } catch {
      // ignore cache errors
    }
  },

  async del(...keys: string[]): Promise<void> {
    if (!client || keys.length === 0) return;
    try {
      await client.del(...keys);
    } catch {
      // ignore cache errors
    }
  },
};

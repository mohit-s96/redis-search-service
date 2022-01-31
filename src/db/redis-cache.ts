import { client } from "..";

export async function getFromCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  expiry: number = 3600 * 24 * 5
): Promise<T> {
  const cached = await client.get(key);

  let parsedcache: T;

  if (cached === null) {
    parsedcache = await fetcher();

    await client.sAdd(key, JSON.stringify(parsedcache));
    await client.expire(key, expiry);
  } else {
    parsedcache = JSON.parse(cached);
  }

  return parsedcache;
}

export async function deleteFromCache(
  key: string,
  data: Record<string, unknown>
): Promise<number> {
  return client.sRem(key, JSON.stringify(data));
}

export async function setCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  expiry: number = 3600 * 24 * 5
): Promise<void> {
  const value = await fetcher();

  await client.sAdd(key, JSON.stringify(value));

  await client.expire(key, expiry);
}

export async function updateCache(
  key: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>
): Promise<void> {
  const status = await client.sRem(key, JSON.stringify(oldValue));

  if (status === 1) {
    await client.sAdd(key, JSON.stringify(newValue));
  }
}

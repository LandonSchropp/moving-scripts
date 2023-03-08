import { mkdirp, pathExists, readFile, writeFile } from "fs-extra";

import { download } from "./download";
import { JSONValue } from "./types";

const CACHE_DIRECTORY = `${ __dirname }/../cache`;

/**
 * If a cache file does not exist, calls the function and writes the results to a file. If the
 * cache file already exists, returns the contents of the file.
 */
export async function cache(fileName: string, func: () => Promise<string | null>) {
  const cachePath = `${ CACHE_DIRECTORY }/${ fileName }`;

  if (await pathExists(cachePath)) {
    return (await readFile(cachePath)).toString();
  }

  const result = await func();

  if (result === null) {
    return null;
  }

  await mkdirp(CACHE_DIRECTORY);
  await writeFile(cachePath, result);

  return result;
}

/**
 * Caches the result of the given function as JSON.
 */
export async function cacheJSON(fileName: string, func: () => Promise<JSONValue>) {
  const result = await cache(fileName, async () => {
    const funcResult = await func();
    return funcResult === null ? null : JSON.stringify(funcResult, null, 2);
  });

  return result === null ? null : JSON.parse(result);
}

/**
 * Downloads the contents of a URL, caching the result.
 */
export async function cacheDownload(fileName: string, url: string) {
  return await cache(fileName, async () => {
    return await download(url);
  });
}

import { mkdirp, pathExists, readFile, readJson, writeFile, writeJson } from "fs-extra";
import fetch from "node-fetch";

const CACHE_DIRECTORY = `${ __dirname }/../cache`;

export function cache<Type>(
  key: string,
  func: (...parameters: (string | string[])[]) => Promise<Type>
) {
  return async (...parameters: (string | string[])[]) => {
    const cacheKey = [ key, ...parameters ]
      .map(value => value.toString())
      .join("-")
      .replaceAll(/\W/g, "%");

    const cachePath = `${ CACHE_DIRECTORY }/${ cacheKey }.json`;

    if (await pathExists(cachePath)) {
      return await readJson(cachePath);
    }

    const result = await func(...parameters);

    await mkdirp(CACHE_DIRECTORY);
    await writeJson(cachePath, result, { spaces: 2 });

    return result;
  };
}

async function downloadFile(url: string) {
  return await (await fetch(url)).text();
}

export async function downloadFileUnlessExists(fileName: string, url: string) {
  const cachePath = `${ CACHE_DIRECTORY }/${ fileName }`;

  if (await pathExists(cachePath)) {
    return await readFile(cachePath);
  }

  const result = await downloadFile(url);

  await mkdirp(CACHE_DIRECTORY);
  await writeFile(cachePath, result);

  return result;
}

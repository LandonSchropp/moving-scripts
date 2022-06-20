import { mkdirp, pathExists, readJson, writeJson } from "fs-extra";

const CACHE_DIRECTORY = `${ __dirname }/../cache`;

export function cache<Type>(key: string, func: (...parameters: string[]) => Promise<Type>) {
  return async (...parameters: string[]) => {
    const cacheKey = [ key, ...parameters ]
      .map(value => value.replaceAll(/\W/g, "%"))
      .join("-");

    const cachePath = `${ CACHE_DIRECTORY }/${ cacheKey }.json`;

    if (await pathExists(cachePath)) {
      return await readJson(cachePath);
    }

    const result = await func(...parameters);

    await mkdirp(CACHE_DIRECTORY);
    await writeJson(cachePath, result);

    return result;
  };
}

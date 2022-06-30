import https from "https";
import fetch from "node-fetch";
import { scrapeHTML, ScrapeOptions } from "scrape-it";

import { cacheJSON } from "./cache";
import { JSONValue, MetroArea, MetroAreaClimate } from "./types";
import { parseNumber } from "./utilities";

async function unsafeScrapeIt<T>(
  url: string,
  options: ScrapeOptions
) : Promise<T> {
  const agent = new https.Agent({ rejectUnauthorized: false });
  const content = await (await fetch(url, { agent })).text();

  return scrapeHTML<T>(content, options);
}

const CLIMATE_DATA_BASE_URL = "https://www.bestplaces.net/climate/city";

export async function fetchMetroAreaClimate(metroArea: MetroArea): Promise<MetroAreaClimate> {
  const city = metroArea.cities[0].toLowerCase().replaceAll(" ", "_");
  const state = metroArea.states[0].toLowerCase().replaceAll(" ", "_");
  const url = `${ CLIMATE_DATA_BASE_URL }/${ state }/${ city }`;

  return await cacheJSON(`climate-data-${ city }-${ state }.json`, async () => {
    const response = await unsafeScrapeIt<JSONValue>(url, {
      summerHighTemperature: {
        selector: "#mainContent_dgClimate > tbody:nth-child(1) > tr:nth-child(6) > td:nth-child(2)",
        convert: parseNumber
      },
      winterLowTemperature: {
        selector: "#mainContent_dgClimate > tbody:nth-child(1) > tr:nth-child(7) > td:nth-child(2)",
        convert: parseNumber
      },
      rainfall: {
        selector: "#mainContent_dgClimate > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(2)",
        convert: parseNumber
      },
      snowfall: {
        selector: "#mainContent_dgClimate > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(2)",
        convert: parseNumber
      },
      numberOfDaysWithPrecipitation: {
        selector: "#mainContent_dgClimate > tbody:nth-child(1) > tr:nth-child(4) > td:nth-child(2)",
        convert: parseNumber
      },
      numberOfSunnyDays: {
        selector: "#mainContent_dgClimate > tbody:nth-child(1) > tr:nth-child(5) > td:nth-child(2)",
        convert: parseNumber
      },
      comfortIndex: {
        selector: "#mainContent_dgClimate > tbody:nth-child(1) > tr:nth-child(8) > td:nth-child(2)",
        convert: parseNumber
      },
      summerComfortIndex: {
        selector: ".display-4",
        convert: value => parseNumber(value.split("/")[0]?.trim())
      },
      winterComfortIndex: {
        selector: ".display-4",
        convert: value => parseNumber(value.split("/")[1]?.trim())
      }
    });

    return response;
  });
}

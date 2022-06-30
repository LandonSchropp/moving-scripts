import scrapeIt from "scrape-it";

import { cacheJSON } from "./cache";
import { JSONValue, MetroArea, MetroAreaClimate } from "./types";
import { parseNumber } from "./utilities";

const CLIMATE_DATA_BASE_URL = "https://www.usclimatedata.com/climate";

export async function fetchMetroAreaClimate(metroArea: MetroArea): Promise<MetroAreaClimate> {
  const city = metroArea.cities[0].toLowerCase().replaceAll(/\W/g, "-");
  const state = metroArea.states[0].toLowerCase().replaceAll(/\W/g, "-");
  const url = `${ CLIMATE_DATA_BASE_URL }/${ city }/${ state }/united-states`;

  return await cacheJSON(`climate-data-${ city }-${ state }.json`, async () => {
    const response = await scrapeIt(url, {
      januaryAverageHighTemperature: {
        selector: "#monthly_table_one td.high:nth-of-type(1)",
        convert: parseNumber
      },
      julyAverageHighTemperature: {
        selector: "#monthly_table_two td.high:nth-of-type(1)",
        convert: parseNumber
      },
      numberOfDaysWithPrecipitation: {
        selector: ".monthly_summary_table tr:nth-of-type(3) td:nth-of-type(2)",
        convert: parseNumber
      },
      averageAnnualPrecipitation: {
        selector: ".monthly_summary_table tr:nth-of-type(5) td:nth-of-type(2)",
        convert: parseNumber
      },
      annualHoursOfSunshine: {
        selector: ".monthly_summary_table tr:nth-of-type(4) td:nth-of-type(2)",
        convert: parseNumber
      }
    }) as { data: JSONValue };

    return response.data;
  });
}

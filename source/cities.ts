import scrapeIt from "scrape-it";
import { usaStates } from "typed-usa-states";

import { cache } from "./cache";

const METRO_AREAS_URL = "https://en.wikipedia.org/wiki/Metropolitan_statistical_area";
const METRO_AREA_REGEX = /^([^,]+),\s+([^,]+)\s+MSA/;

function parseNumber(value: string) {
  return parseInt(value.replace(",", ""), 10);
}

function stateAbbreviationToName(abbreviation: string) {
  return usaStates.find(state => state.abbreviation === abbreviation)?.name;
}

interface MetroArea {
  name: string,
  population: number
}

export const fetchMetroAreas = cache<MetroArea[]>("metro-areas", async () => {
  const response = await scrapeIt(METRO_AREAS_URL, {
    metroAreas: {
      listItem: "table:nth-of-type(2) tr",
      data: {
        name: {
          selector: "td:nth-of-type(2)",
          convert: value => value.match(METRO_AREA_REGEX)?.[1].replaceAll("-", "/")
        },
        states: {
          selector: "td:nth-of-type(2)",
          convert: value => {
            return value.match(METRO_AREA_REGEX)?.[2].split("-").map(stateAbbreviationToName);
          }
        },
        population: {
          selector: "td:nth-of-type(3)",
          convert: parseNumber
        }
      }
    }
  }) as { data: { metroAreas: MetroArea[] } };

  return response.data.metroAreas;
});

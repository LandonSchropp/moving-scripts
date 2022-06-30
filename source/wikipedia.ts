import { tail } from "lodash";
import _ from "lodash";
import scrapeIt from "scrape-it";

import { cacheJSON } from "./cache";
import { stateAbbreviationToName } from "./metro-areas";
import { JSONValue, MetroArea } from "./types";
import { parseNumber } from "./utilities";

const METRO_AREAS_URL = "https://en.wikipedia.org/wiki/Metropolitan_statistical_area";
const STATE_POLITICS_URL = "https://en.wikipedia.org/wiki/Political_party_strength_in_U.S._states";

const METRO_AREA_REGEX = /^([^,]+),\s+([^,]+)\s+MSA/;

const DEMOCRAT_REGEX = /Democratic(?<democratPercent>\d+)[-–](?<republicanPercent>\d+)/;
const REPUBLICAN_REGEX = /Republican(?<republicanPercent>\d+)[-–](?<democratPercent>\d+)/;
const SPLIT_REGEX = /Even(?<democratPercent>\d+)[-–](?<republicanPercent>\d+)/;

const MODERATE_PERCENTAGE = 0.08;

export async function fetchMetroAreas() {
  return await cacheJSON("metro-areas.json", async () => {
    const response = await scrapeIt(METRO_AREAS_URL, {
      metroAreas: {
        listItem: "table:nth-of-type(2) tr",
        data: {
          cities: {
            selector: "td:nth-of-type(2)",
            convert: value => value.match(METRO_AREA_REGEX)?.[1].split(/[–\-/]/g)
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
    }) as { data: { metroAreas: JSONValue[] } };

    return tail(response.data.metroAreas);
  }) as MetroArea[];
}

function extractPoliticalPercentages(value: string) {

  const democratMatch = value.match(DEMOCRAT_REGEX);
  const republicanMatch = value.match(REPUBLICAN_REGEX);
  const splitMatch = value.match(SPLIT_REGEX);

  const match = democratMatch || republicanMatch || splitMatch;

  if (!match) {
    return { democratPercent: null, splitMatch: null };
  }

  return _.mapValues(match.groups, parseFloat);
}

function politicalColor(liberalness: number) {
  if (liberalness > 0.5 + MODERATE_PERCENTAGE / 2) {
    return "blue";
  }

  if (liberalness < 0.5 - MODERATE_PERCENTAGE / 2) {
    return "red";
  }

  return "purple";
}

export async function fetchStatePoliticalData() {
  return await cacheJSON("state-politics.json", async () => {
    const response = await scrapeIt(STATE_POLITICS_URL, {
      states: {
        listItem: "table:nth-of-type(6) tr",
        data: {
          state: "td:nth-of-type(1)",
          percentages: {
            selector: "td:nth-of-type(9)",
            convert: extractPoliticalPercentages
          }
        }
      }
    }) as { data: { states: {state: string, percentages: Record<string, number>}[] } };

    const states = _.tail(response.data.states);

    return states.map(({ state, percentages: { democratPercent, republicanPercent } }) => {
      const liberalness = democratPercent / (democratPercent + republicanPercent);

      return {
        state,
        democratPercent,
        republicanPercent,
        liberalness,
        color: politicalColor(liberalness)
      };
    });
  });
}

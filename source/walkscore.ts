import scrapeIt from "scrape-it";

import { cacheJSON } from "./cache";
import { JSONValue, Neighborhood, NeighborhoodWalkScore } from "./types";
import { parseNumber } from "./utilities";

const BASE_URL = "https://www.walkscore.com/OR/Portland";

function neighborhoodUrl(neighborhood: Neighborhood) {
  return `${ BASE_URL }/${ neighborhood.neighborhood.replaceAll(" ", "_") }`;
}

export async function fetchNeighborhoodWalkScore(
  neighborhood: Neighborhood
): Promise<NeighborhoodWalkScore> {
  const fileName = `${ neighborhood.neighborhood.replaceAll(/\W+/g, "-") }-walk-score.json`;
  const url = neighborhoodUrl(neighborhood);

  return await cacheJSON(fileName, async () => {
    const response = await scrapeIt(url, {
      walkScore: {
        selector: ".score-info-link img:nth-of-type(2)",
        attr: "alt",
        convert: parseNumber
      },
      transitScore: {
        selector: ".score-info-link img:nth-of-type(2)",
        attr: "alt",
        convert: parseNumber
      },
      bikeScore: {
        selector: ".score-info-link img:nth-of-type(3)",
        attr: "alt",
        convert: parseNumber
      },
      valid: {
        selector: "a.o-btn.tall[onclick*='apt search button']",
        convert: (value) => {
          return !/Portland/.test(value);
        } }
    }) as { data: NeighborhoodWalkScore & { valid: boolean } };

    const { valid, ...walkScore } = response.data;

    if (!valid) {
      // eslint-disable-next-line no-console
      console.error(`\x1b[33m☠️  The walk score URL '${ url }' is not valid.\x1b[0m`);
      return { walkScore: null, bikeScore: null, transitScore: null };
    }

    return walkScore as unknown as JSONValue;
  });
}

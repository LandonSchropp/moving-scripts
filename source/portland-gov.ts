import { difference, intersection } from "lodash";
import scrapeIt from "scrape-it";

import { cacheJSON } from "./cache";
import { JSONValue, Neighborhood, NeighborhoodDescription } from "./types";

const BASE_URL = `https://www.portland.gov`;
const NEIGHBORHOODS_URL = `${ BASE_URL }/neighborhoods`;
const IGNORED_NEIGHBORHOOD_WORDS = [ "portland", "heights", "terrace" ];

type NeighborhoodDescriptionWithName = NeighborhoodDescription & { neighborhood: string };

async function fetchNeighborhoods(): Promise<NeighborhoodDescriptionWithName[]> {
  return await cacheJSON("portland-gov-neighborhoods.json", async () => {
    const response = await scrapeIt(NEIGHBORHOODS_URL, {
      neighborhoods: {
        listItem: ".view-content .views-row",
        data: {
          neighborhood: {
            selector: "h2",
            trim: true
          },
          overview: {
            selector: "h2 a",
            attr: "href",
            convert: value => `${ BASE_URL }${ value }`
          },
          description: {
            selector: "p",
            trim: true
          }
        }
      }
    }) as { data: { neighborhoods: JSONValue[] } };

    return response.data.neighborhoods;
  }) as NeighborhoodDescriptionWithName[];
}

function neighborhoodsMatch(first: string, second: string): boolean {
  const firstArray = difference(first.toLowerCase().split(/[^a-z]+/), IGNORED_NEIGHBORHOOD_WORDS);
  const secondArray = difference(second.toLowerCase().split(/[^a-z]+/), IGNORED_NEIGHBORHOOD_WORDS);

  return intersection(firstArray, secondArray).length === firstArray.length;
}

export async function fetchNeighborhoodDescription(
  neighborhood: Neighborhood
): Promise<NeighborhoodDescription> {
  const neighborhoods = await fetchNeighborhoods();

  const match = neighborhoods.find(({ neighborhood: descriptionNeighborhood }) => {
    return neighborhoodsMatch(descriptionNeighborhood, neighborhood.neighborhood);
  });

  if (!match) {
    // eslint-disable-next-line no-console
    console.log(`🧟 Couldn't find description for neighborhood '${ neighborhood.neighborhood }'.`);
    return { description: null, overview: null };
  }

  return {
    description: match.description,
    overview: match.overview
  };
}

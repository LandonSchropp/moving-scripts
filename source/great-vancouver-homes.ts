import scrapeIt from "scrape-it";

import { cacheJSON } from "./cache";
import { Neighborhood } from "./types";

const NEIGHBORHOODS_URL = "https://www.greatvancouverhomes.com/communities/portland-neighborhoods/";

type PartialNeighborhood = {
  neighborhood: string
}

type PartialQuadrant = {
  quadrant: string,
  neighborhoods: PartialNeighborhood[]
}

export async function fetchPortlandNeighborhoods() {
  return await cacheJSON("portland-neighborhoods.json", async () => {
    const response = await scrapeIt(NEIGHBORHOODS_URL, {
      quadrants: {
        listItem: ".js-content-label",
        data: {
          quadrant: {
            selector: ".si-content-label__title",
            trim: true
          },
          neighborhoods: {
            listItem: ".si-content-label__link",
            data: {
              neighborhood: {
                selector: "a",
                trim: true
              }
            }
          }
        }
      }
    }) as { data: { quadrants: PartialQuadrant[] } };

    return response.data.quadrants.map(({ quadrant, neighborhoods }) => {
      return neighborhoods.map((neighborhood) => ({ ...neighborhood, quadrant }));
    }).flat();
  }) as Neighborhood[];
}

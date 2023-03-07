import { fetchPortlandNeighborhoods } from "./great-vancouver-homes";
import { syncNeighborhoodsToNotion } from "./notion-neighborhoods";
import { ExtendedNeighborhood, Neighborhood } from "./types";
import { fetchNeighborhoodWalkScore } from "./walkscore";

async function extendNeighborhood(neighborhood: Neighborhood) : Promise<ExtendedNeighborhood> {
  return {
    ...neighborhood,
    ...await fetchNeighborhoodWalkScore(neighborhood)
  };
}

(async () => {
  const neighborhoods = await fetchPortlandNeighborhoods();
  const extendedNeighborhoods = [] as ExtendedNeighborhood[];

  for (let i = 0; i < neighborhoods.length; i++) {
    const neighborhood = neighborhoods[i];
    const progress = `${ i + 1 } / ${ neighborhoods.length }`;

    // eslint-disable-next-line no-console
    console.log(`🧠 ${ progress }: Fetching data for neighborhood ${ neighborhood.neighborhood }`);
    extendedNeighborhoods.push(await extendNeighborhood(neighborhood));
  }

  await syncNeighborhoodsToNotion(extendedNeighborhoods);
})();

import { fetchPortlandNeighborhoods } from "./great-vancouver-homes";
import { ExtendedNeighborhood, Neighborhood } from "./types";

async function extendNeighborhood(neighborhood: Neighborhood) : Promise<ExtendedNeighborhood> {
  return {
    ...neighborhood
  };
}

(async () => {
  const neighborhoods = await fetchPortlandNeighborhoods();
  const extendedMetroAreas = [] as ExtendedNeighborhood[];

  for (let i = 0; i < neighborhoods.length; i++) {
    const neighborhood = neighborhoods[i];
    const progress = `${ i + 1 } / ${ neighborhoods.length }`;

    // eslint-disable-next-line no-console
    console.log(`🧠 ${ progress }: Fetching data for neighborhood ${ neighborhood.neighborhood }`);
    extendedMetroAreas.push(await extendNeighborhood(neighborhood));
  }
})();

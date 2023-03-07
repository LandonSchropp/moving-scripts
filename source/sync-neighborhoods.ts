import { ExtendedNeighborhood, Neighborhood } from "./types";

async function extendNeighborhood(neighborhood: Neighborhood) : Promise<ExtendedNeighborhood> {
  return {
    ...neighborhood
  };
}

(async () => {
  const neighborhoods = [] as Neighborhood[];
  const extendedMetroAreas = [] as ExtendedNeighborhood[];

  for (let i = 0; i < neighborhoods.length; i++) {
    const neighborhood = neighborhoods[i];
    const progress = `${ i + 1 } / ${ neighborhoods.length }`;

    // eslint-disable-next-line no-console
    console.log(`🧠 ${ progress }: Fetching data for neighborhood ${ neighborhood.name }`);
    extendedMetroAreas.push(await extendNeighborhood(neighborhood));
  }
})();

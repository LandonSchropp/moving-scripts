import { fetchMetroAreaClimate } from "./best-places";
import { fetchPoliticalDataForMetroArea } from "./bloomberg";
import { metroAreaTitle } from "./metro-areas";
import { syncMetroAreasToNotion } from "./notion";
import { ExtendedMetroArea, MetroArea } from "./types";
import { fetchMetroAreas, fetchStatePoliticalData } from "./wikipedia";
import { getMetroAreaHousingPrices } from "./zillow";

async function extendMetroArea(metroArea: MetroArea) : Promise<ExtendedMetroArea> {
  return {
    ...metroArea,
    ...await getMetroAreaHousingPrices(metroArea),
    ...await fetchPoliticalDataForMetroArea(metroArea),
    ...await fetchMetroAreaClimate(metroArea)
  };
}

(async () => {
  // This data isn't used in any of the calculations, but it's still helpful for colorizing the
  // states.
  await fetchStatePoliticalData();

  const metroAreas = await fetchMetroAreas();

  const extendedMetroAreas = [] as ExtendedMetroArea[];

  for (let i = 0; i < metroAreas.length; i++) {

    const metroArea = metroAreas[i];
    const progress = `${ i + 1 } / ${ metroAreas.length }`;

    // eslint-disable-next-line no-console
    console.log(`🧠 ${ progress }: Fetching data for metro area ${ metroAreaTitle(metroArea) }`);
    extendedMetroAreas.push(await extendMetroArea(metroArea));
  }

  await syncMetroAreasToNotion(extendedMetroAreas);
})();

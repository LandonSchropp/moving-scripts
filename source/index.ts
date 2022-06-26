import { fetchPoliticalDataForMetroArea } from "./bloomberg";
import { syncMetroAreasToNotion } from "./notion";
import { ExtendedMetroArea, MetroArea } from "./types";
import { fetchMetroAreas } from "./wikipedia";
import { getMetroAreaHousingPrices } from "./zillow";

async function extendMetroArea(metroArea: MetroArea) : Promise<ExtendedMetroArea> {
  return {
    ...metroArea,
    ...await getMetroAreaHousingPrices(metroArea),
    ...await fetchPoliticalDataForMetroArea(metroArea)
  };
}

(async () => {
  const metroAreas = await fetchMetroAreas();

  const extendMetroAreas = [] as ExtendedMetroArea[];

  for (const metroArea of metroAreas) {
    extendMetroAreas.push(await extendMetroArea(metroArea));
  }

  await syncMetroAreasToNotion(extendMetroAreas);
})();

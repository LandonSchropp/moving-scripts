import { syncMetroAreasToNotion } from "./notion";
import { MetroArea } from "./types";
import { fetchMetroAreas } from "./wikipedia";
import { getMetroAreaHousingPrices } from "./zillow";

async function extendMetroArea(metroArea: MetroArea) {
  return {
    ...metroArea,
    ...await getMetroAreaHousingPrices(metroArea)
  };
}

(async () => {
  const metroAreas = await fetchMetroAreas();

  const extendMetroAreas = [] as MetroArea[];

  for (const metroArea of metroAreas) {
    extendMetroAreas.push(await extendMetroArea(metroArea));
  }

  await syncMetroAreasToNotion(extendMetroAreas);
})();

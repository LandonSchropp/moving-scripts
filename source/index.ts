import { fetchMetroAreas } from "./cities";
import { syncMetroAreasToNotion } from "./notion";

(async () => {
  const metroAreas = await fetchMetroAreas();
  await syncMetroAreasToNotion(metroAreas);
})();

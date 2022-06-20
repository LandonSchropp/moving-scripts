import { fetchMetroAreas } from "./cities";

(async () => {
  console.log(await fetchMetroAreas());
})();

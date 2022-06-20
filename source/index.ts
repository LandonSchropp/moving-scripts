import { fetchCities } from "./cities";

(async () => {
  console.log(await fetchCities());
})();

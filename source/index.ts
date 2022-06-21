import { fetchCities } from "./notion";

(async () => {
  console.log(await fetchCities());
})();

import { createMetroAreaInNotion, fetchCities } from "./notion";

(async () => {
  await createMetroAreaInNotion({
    states: [ "California", "New York" ],
    costOfLivingIndex: 1,
    numberOfSunnyDays: 2,
    medianHousePrice: 3,
    schoolRatingIndex: 4,
    population: 5,
    location: "Banana"
  });
})();

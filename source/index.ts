import { createOrUpdateMetroAreaInNotion } from "./notion";

(async () => {
  await createOrUpdateMetroAreaInNotion({
    states: [ "California", "New York" ],
    costOfLivingIndex: 1,
    numberOfSunnyDays: 2,
    medianHousePrice: 3,
    schoolRatingIndex: 4,
    population: 10,
    location: "Banana"
  });
})();

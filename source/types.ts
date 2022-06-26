export type MetroAreaHousingPrices = {
  topTierHousingPrice: number | null,
  middleTierHousingPrice: number | null,
  bottomTierHousingPrice: number | null,
  threeBedroomHousingPrice: number | null
};

export type MetroArea = {
  states: string[],
  costOfLivingIndex?: number,
  numberOfSunnyDays?: number,
  medianHousePrice?: number,
  schoolRatingIndex?: number,
  population: number,
  cities: string[],
  topTierHousingPrice?: number | null,
  middleTierHousingPrice?: number | null,
  bottomTierHousingPrice?: number | null,
  threeBedroomHousingPrice?: number | null
}

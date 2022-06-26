// https://dev.to/ankittanna/how-to-create-a-type-for-complex-json-object-in-typescript-d81
export type JSONValue =
  | null
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

export interface MetroArea {
  cities: string[],
  states: string[],
  population: number
  numberOfSunnyDays?: number,
  schoolRatingIndex?: number,
}

export interface MetroAreaHousingPrices {
  topTierHousingPrice: number | null,
  middleTierHousingPrice: number | null,
  bottomTierHousingPrice: number | null,
  threeBedroomHousingPrice: number | null
}

export interface MetroAreaPolitics {
  winnerOf2020Election: string | null,
  winnerOf2020ElectionVotePercentage: number | null
}

export interface ExtendedMetroArea extends MetroArea, MetroAreaHousingPrices, MetroAreaPolitics {}

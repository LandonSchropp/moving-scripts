import { syncObjectsToNotion } from "./notion";
import { ExtendedMetroArea } from "./types";

const CITIES_DATABASE_ID = "c0e8bf94ba874800b6e66af872e32ce8";

const SCHEMA = {
  "cities": "title",
  "states": "multi_select",
  "population": "number",

  // Housing
  "topTierHousingPrice": "number",
  "middleTierHousingPrice": "number",
  "bottomTierHousingPrice": "number",
  "threeBedroomHousingPrice": "number",

  // Politics
  "winnerOf2020Election": "select",
  "winnerOf2020ElectionVotePercentage": "number",

  // Weather
  "summerHighTemperature": "number",
  "winterLowTemperature": "number",
  "rainfall": "number",
  "snowfall": "number",
  "numberOfDaysWithPrecipitation": "number",
  "numberOfSunnyDays": "number",
  "comfortIndex": "number",
  "summerComfortIndex": "number",
  "winterComfortIndex": "number"
} as const;

export async function syncMetroAreasToNotion(metroAreas: ExtendedMetroArea[]) {
  return syncObjectsToNotion(metroAreas, CITIES_DATABASE_ID, SCHEMA, "cities", "population");
}

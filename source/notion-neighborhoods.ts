import { syncObjectsToNotion } from "./notion";
import { ExtendedNeighborhood } from "./types";

const NEIGHBORHOODS_DATABASE_ID = "a93092efcbc446dd99020c4beea8094e";

const SCHEMA = {
  neighborhood: "title",
  quadrant: "select",
  walkScore: "number",
  bikeScore: "number",
  transitScore: "number",
  overview: "url",
  description: "text"
} as const;

export async function syncNeighborhoodsToNotion(neighborhoods: ExtendedNeighborhood[]) {
  return syncObjectsToNotion(
    neighborhoods,
    NEIGHBORHOODS_DATABASE_ID,
    SCHEMA,
    "neighborhood",
    "neighborhood"
  );
}

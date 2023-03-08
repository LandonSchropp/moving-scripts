import { syncObjectsToNotion } from "./notion";
import { ExtendedNeighborhood } from "./types";

const NEIGHBORHOODS_DATABASE_ID = "a93092efcbc446dd99020c4beea8094e";

const SCHEMA = {
  neighborhood: "title",
  quadrant: "select",

  // Walk Score
  walkScore: "number",
  bikeScore: "number",
  transitScore: "number",

  // Description
  overview: "url",
  description: "text",

  // Grades
  grade: "select",
  schools: "select",
  safety: "select",
  nightlife: "select",
  family: "select",
  health: "select",
  outdoor: "select",
  commute: "select"
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

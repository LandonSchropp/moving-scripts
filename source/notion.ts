import { Client } from "@notionhq/client";

const CITIES_DATABASE_ID = "c0e8bf94ba874800b6e66af872e32ce8";

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

function notionRowToMetroArea(notionRow) {
  return {
    states: notionRow.properties["States"].multi_select.map(value => value.name),
    population: notionRow.properties["Population"].number,
    medianHousePrice: notionRow.properties["Median House Price"].number,
    numberOfSunnyDays: notionRow.properties["Number of Sunny Days"].number,
    costOfLivingIndex: notionRow.properties["Cost of Living Index"].number,
    schoolRatingIndex: notionRow.properties["School Rating Index"].number
  };
}

export async function fetchCities() {
  const response = await notion.databases.query({
    database_id: CITIES_DATABASE_ID
  });

  return response.results.map(notionRowToMetroArea);
}

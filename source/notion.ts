import { Client } from "@notionhq/client";
import _ from "lodash";

import { MetroArea } from "./types";

const CITIES_DATABASE_ID = "c0e8bf94ba874800b6e66af872e32ce8";

const SCHEMA = {
  "States": "multi_select",
  "Population": "number",
  "Median House Price": "number",
  "Number of Sunny Days": "number",
  "Cost of Living Index": "number",
  "School Rating Index": "number",
  "Location": "title"
};

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

function convertKeyToNotionFormat(key: string) {
  return _.startCase(key)
    .replaceAll("Of", "of")
    .replaceAll("To", "to");
}

function convertPropertyToNotionFormat(value: number | string | string[] | null, key: string) {
  if (!(key in SCHEMA)) {
    throw new Error(`The key ${ key } in not in the schema!`);
  }

  const type = SCHEMA[key];

  // The required values for the properties can be found here:
  // https://developers.notion.com/reference/property-value-object#title-property-values
  switch (type) {
    case "title":
      return { "title": [ { "type": "text", "text": { "content": value } } ] };
    case "number":
      return { number: value };
    case "multi_select":
      // eslint-disable-next-line no-extra-parens
      return { multi_select: (value as string[]).map(option => ({ name: option })) };
    default:
      throw new Error(`Unknown type ${ type }`);
  }
}

function metroAreaToNotionProperties(metroArea: MetroArea) {
  return _.chain(metroArea)
    .mapKeys((_value, key) => convertKeyToNotionFormat(key))
    .mapValues(convertPropertyToNotionFormat)
    .value();
}

async function fetchMetroAreasFromNotion() {
  const response = await notion.databases.query({
    database_id: CITIES_DATABASE_ID
  });

  return response.results;
}

async function createMetroAreaInNotion(metroArea: MetroArea) {
  await notion.pages.create({
    parent: {
      database_id: CITIES_DATABASE_ID
    },
    properties: metroAreaToNotionProperties(metroArea)
  });
}

async function updateMetroAreaInNotion(pageId: string, metroArea: MetroArea) {
  await notion.pages.update({
    page_id: pageId,
    properties: metroAreaToNotionProperties(metroArea)
  });
}

export async function createOrUpdateMetroAreaInNotion(metroArea: MetroArea) {
  const existingMetroAreaPages = await fetchMetroAreasFromNotion();

  const matchingMetroAreaPage = _.find(existingMetroAreaPages, {
    properties: {
      "Location": {
        title: [
          {
            plain_text: metroArea.location
          }
        ]
      }
    }
  });

  if (matchingMetroAreaPage) {
    await updateMetroAreaInNotion(matchingMetroAreaPage.id, metroArea);
  }
  else {
    await createMetroAreaInNotion(metroArea);
  }
}

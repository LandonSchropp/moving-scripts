import { Client } from "@notionhq/client";
import { QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";
import _ from "lodash";

import { MetroArea } from "./types";

// Extract the Notion types from the exported type in Notion.
// https://github.com/makenotion/notion-sdk-js/issues/280#issuecomment-1099798305
type AllKeys<T> = T extends never ? never : keyof T;
type OptionalKeys<T> = Exclude<AllKeys<T>, keyof T>;
type Index<T, K extends PropertyKey, D = never> = T extends never ? never : K extends keyof T ? T[K]
  : D;
type Widen<T> = { [K in OptionalKeys<T>]?: Index<T, K>; } & { [K in keyof T]: T[K] };
type NotionDatabaseQueryResult = Widen<QueryDatabaseResponse["results"][number]>;

const CITIES_DATABASE_ID = "c0e8bf94ba874800b6e66af872e32ce8";

const SCHEMA = {
  "States": "multi_select",
  "Population": "number",
  "Median House Price": "number",
  "Number of Sunny Days": "number",
  "Cost of Living Index": "number",
  "School Rating Index": "number",
  "Top Tier Housing Price": "number",
  "Middle Tier Housing Price": "number",
  "Bottom Tier Housing Price": "number",
  "Three Bedroom Housing Price": "number",
  "Cities": "title"
};

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

function convertKeyToNotionFormat(key: string) {
  return _.startCase(key)
    .replaceAll(" Of", " of")
    .replaceAll(" To", " to")
    .replaceAll(" The", " the");
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
      return {
        "title": [
          {
            "type": "text",
            "text": {
              // eslint-disable-next-line no-extra-parens
              "content": (value as string[]).join(" / ")
            }
          }
        ]
      };
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
    .omitBy(value => _.isNil(value))
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

async function createOrUpdateMetroAreaInNotion(
  existingMetroAreaPages: NotionDatabaseQueryResult[],
  metroArea: MetroArea
) {
  const matchingMetroAreaPage = _.find(existingMetroAreaPages, {
    properties: {
      "Cities": {
        title: [
          {
            plain_text: metroArea.cities
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

export async function syncMetroAreasToNotion(metroAreas: MetroArea[]) {
  const existingMetroAreaPages = await fetchMetroAreasFromNotion();

  for (const metroArea of metroAreas) {
    await createOrUpdateMetroAreaInNotion(existingMetroAreaPages, metroArea);
  }
}

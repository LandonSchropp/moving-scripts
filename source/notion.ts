import { Client } from "@notionhq/client";
import {
  QueryDatabaseResponse,
  UpdatePageParameters
} from "@notionhq/client/build/src/api-endpoints";
import _ from "lodash";

import { metroAreaCitiesToTitle, metroAreaTitle } from "./metro-areas";
import { ExtendedMetroArea } from "./types";

// Extract the Notion types from the exported type in Notion.
// https://github.com/makenotion/notion-sdk-js/issues/280#issuecomment-1099798305
type AllKeys<T> = T extends never ? never : keyof T;
type OptionalKeys<T> = Exclude<AllKeys<T>, keyof T>;
type Index<T, K extends PropertyKey, D = never> = T extends never ? never : K extends keyof T ? T[K]
  : D;
type Widen<T> = { [K in OptionalKeys<T>]?: Index<T, K>; } & { [K in keyof T]: T[K] };
type NotionDatabaseQueryResult = Widen<QueryDatabaseResponse["results"][number]>;
type NotionPageProperties = NonNullable<UpdatePageParameters["properties"]>;
type NotionProperty = NotionPageProperties["type"];

const CITIES_DATABASE_ID = "c0e8bf94ba874800b6e66af872e32ce8";

const SCHEMA = {
  "Cities": "title",
  "States": "multi_select",
  "Population": "number",

  // Housing
  "Top Tier Housing Price": "number",
  "Middle Tier Housing Price": "number",
  "Bottom Tier Housing Price": "number",
  "Three Bedroom Housing Price": "number",

  // Politics
  "Winner of 2020 Election": "select",
  "Winner of 2020 Election Vote Percentage": "number",

  // Weather
  "Summer High Temperature": "number",
  "Winter Low Temperature": "number",
  "Rainfall": "number",
  "Snowfall": "number",
  "Number of Days With Precipitation": "number",
  "Number of Sunny Days": "number",
  "Comfort Index": "number",
  "Summer Comfort Index": "number",
  "Winter Comfort Index": "number"
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

function convertPropertyToNotionFormat(
  value: number | string | string[] | null,
  key: string
): NotionProperty {
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
              "content": metroAreaCitiesToTitle(value as string[])
            }
          }
        ]
      };
    case "number":
      return { number: value as number };
    case "select":
      return { select: { name: value as string } };
    case "multi_select":
      // eslint-disable-next-line no-extra-parens
      return { multi_select: (value as string[]).map(option => ({ name: option })) };
    default:
      throw new Error(`Unknown type ${ type }`);
  }
}

function metroAreaToNotionProperties(metroArea: ExtendedMetroArea) {
  // NOTE: I'm using reduce here because the TypeScript compiler couldn't handle Lodash's omitBy
  // function.
  return Object.keys(metroArea).reduce((accumulator, key) => {
    const value = metroArea[key];
    const notionKey = convertKeyToNotionFormat(key);

    if (!value) {
      return accumulator;
    }

    accumulator[notionKey] = convertPropertyToNotionFormat(value, notionKey);

    return accumulator;
  }, {});
}

async function fetchMetroAreasFromNotion() {
  let response = await notion.databases.query({
    database_id: CITIES_DATABASE_ID
  });

  let pages = response.results;

  while (response.next_cursor) {
    response = await notion.databases.query({
      database_id: CITIES_DATABASE_ID,
      start_cursor: response.next_cursor
    });

    pages = [ ...pages, ...response.results ];
  }

  return pages;
}

async function createMetroAreaInNotion(metroArea: ExtendedMetroArea) {
  await notion.pages.create({
    parent: {
      database_id: CITIES_DATABASE_ID
    },
    properties: metroAreaToNotionProperties(metroArea)
  });
}

async function updateMetroAreaInNotion(pageId: string, metroArea: ExtendedMetroArea) {
  await notion.pages.update({
    page_id: pageId,
    properties: metroAreaToNotionProperties(metroArea)
  });
}

function findMatchingMetroAreaForNotionPage(
  metroAreaPages: NotionDatabaseQueryResult[],
  metroArea: ExtendedMetroArea,
) {

  // HACK: Even though it's technically possible for two cities to have the same population,
  // practically it won't happen, so I'm using that as my key.
  return _.find(metroAreaPages, {
    properties: {
      Population: {
        number: metroArea.population
      }
    }
  });
}

async function createOrUpdateMetroAreaInNotion(
  existingMetroAreaPages: NotionDatabaseQueryResult[],
  metroArea: ExtendedMetroArea,
) {
  const matchingMetroAreaPage = findMatchingMetroAreaForNotionPage(
    existingMetroAreaPages,
    metroArea
  );

  if (matchingMetroAreaPage) {
    await updateMetroAreaInNotion(matchingMetroAreaPage.id, metroArea);
  }
  else {
    await createMetroAreaInNotion(metroArea);
  }
}

export async function syncMetroAreasToNotion(metroAreas: ExtendedMetroArea[]) {
  const existingMetroAreaPages = await fetchMetroAreasFromNotion();

  for (let i = 0; i < metroAreas.length; i++) {
    const metroArea = metroAreas[i];
    const progress = `${ i + 1 } / ${ metroAreas.length }`;

    // eslint-disable-next-line no-console
    console.log(`☁️  ${ progress }: Syncing metro area ${ metroAreaTitle(metroArea) } to Notion`);

    await createOrUpdateMetroAreaInNotion(existingMetroAreaPages, metroArea);
  }
}

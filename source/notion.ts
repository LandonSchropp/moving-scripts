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
type NotionPageProperties = NonNullable<NotionDatabaseQueryResult["properties"]>;
type NotionProperty = NotionPageProperties["type"];

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

const convertKeyFromNotionFormat = _.camelCase;

function convertKeyToNotionFormat(key: string) {
  return _.startCase(key)
    .replaceAll("Of", "of")
    .replaceAll("To", "to");
}

function convertPropertyFromNotionFormat(notionProperty: NotionProperty) {
  if ("title" in notionProperty) {
    return notionProperty.title[0].plain_text;
  }

  if ("number" in notionProperty) {
    return notionProperty.number;
  }

  if ("multi_select" in notionProperty) {
    return notionProperty.multi_select.map(value => value.name);
  }

  throw new Error(`Unknown type for property ${ JSON.stringify(notionProperty) }`);
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

function notionRowToMetroArea(notionPage: NotionDatabaseQueryResult) {
  return _.chain(notionPage.properties)
    .mapValues(convertPropertyFromNotionFormat)
    .mapKeys((_value, key) => convertKeyFromNotionFormat(key))
    .value();
}

function metroAreaToNotionProperties(metroArea: MetroArea) {
  return _.chain(metroArea)
    .mapKeys((_value, key) => convertKeyToNotionFormat(key))
    .mapValues(convertPropertyToNotionFormat)
    .value();
}

export async function fetchCities() {
  const response = await notion.databases.query({
    database_id: CITIES_DATABASE_ID
  });

  return response.results.map(notionRowToMetroArea);
}

export async function createMetroAreaInNotion(metroArea: MetroArea) {
  await notion.pages.create({
    parent: {
      database_id: CITIES_DATABASE_ID
    },
    properties: metroAreaToNotionProperties(metroArea)
  });
}

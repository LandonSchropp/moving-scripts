import { Client } from "@notionhq/client";
import { QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";
import _ from "lodash";
import { camelCase } from "voca";

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

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const convertKeyFromNotionFormat = camelCase;

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

function notionRowToMetroArea(notionPage: NotionDatabaseQueryResult) {
  return _.chain(notionPage.properties)
    .mapValues(convertPropertyFromNotionFormat)
    .mapKeys((_value, key) => convertKeyFromNotionFormat(key))
    .value();
}

export async function fetchCities() {
  const response = await notion.databases.query({
    database_id: CITIES_DATABASE_ID
  });

  return response.results.map(notionRowToMetroArea);
}

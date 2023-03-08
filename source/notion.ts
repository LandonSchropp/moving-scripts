import { Client } from "@notionhq/client";
import {
  QueryDatabaseResponse,
  UpdatePageParameters
} from "@notionhq/client/build/src/api-endpoints";
import _, { isArray } from "lodash";

import { metroAreaCitiesToTitle } from "./metro-areas";

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

type SchemaValue = "multi_select" | "number" | "select" | "title" | "text" | "url";
type Schema = { [key: string]: SchemaValue }

type SerializableValue = number | string | string[] | null;
type SerializableObject<SchemaType> = { [Property in keyof SchemaType]: SerializableValue };

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
  value: SerializableValue,
  key: string,
  schema: Schema
): NotionProperty {
  if (!(key in schema)) {
    throw new Error(`The key ${ key } in not in the schema!`);
  }

  const type = schema[key];

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
              // FIX: This should be replaced by a more nuanced implementation. However, this is a
              // quick fix to get this working for now.
              "content": isArray(value)
                ? metroAreaCitiesToTitle(value as string[])
                : `${ value }`
            }
          }
        ]
      };
    case "text":
      return {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": value as string
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
    case "url":
      return { url: value as string };
    default:
      throw new Error(`Unknown type ${ type }`);
  }
}

export function objectToNotionProperties<T extends Schema>(
  object: SerializableObject<T>,
  schema: T
) {
  // NOTE: I'm using reduce here because the TypeScript compiler couldn't handle Lodash's omitBy
  // function.
  return Object.keys(object).reduce((accumulator, key) => {
    const value = object[key];
    const notionKey = convertKeyToNotionFormat(key);

    if (!value) {
      return accumulator;
    }

    accumulator[notionKey] = convertPropertyToNotionFormat(value, key, schema);

    return accumulator;
  }, {});
}

export async function fetchPagesFromNotionDatabase(databaseId: string) {
  let response = await notion.databases.query({ database_id: databaseId });

  let pages = response.results;

  while (response.next_cursor) {
    response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: response.next_cursor
    });

    pages = [ ...pages, ...response.results ];
  }

  return pages;
}

async function createPageInNotion<T extends Schema>(
  object: SerializableObject<T>,
  databaseId: string,
  schema: T
) {
  await notion.pages.create({
    parent: {
      database_id: databaseId
    },
    properties: objectToNotionProperties(object, schema)
  });
}

async function updatePageInNotion<T extends Schema>(
  pageId: string,
  object: SerializableObject<T>,
  schema: T
) {
  await notion.pages.update({
    page_id: pageId,
    properties: objectToNotionProperties(object, schema)
  });
}

function findMatchingNotionPage<T extends Schema>(
  existingPages: NotionDatabaseQueryResult[],
  object: SerializableObject<T>,
  schema: T,
  matchKey: keyof object
) {
  const objectSubset = { [matchKey]: object[matchKey] };
  const schemaSubset = { [matchKey]: schema[matchKey] };
  const properties = objectToNotionProperties(objectSubset, schemaSubset);
  return _.find(existingPages, { properties });
}

async function createOrUpdatePageInNotion<T extends Schema>(
  existingPages: NotionDatabaseQueryResult[],
  object: SerializableObject<T>,
  databaseId: string,
  schema: T,
  matchKey: keyof object
) {
  const matchingPage = findMatchingNotionPage(
    existingPages,
    object,
    schema,
    matchKey
  );

  if (matchingPage) {
    await updatePageInNotion(matchingPage.id, object, schema);
  }
  else {
    await createPageInNotion(object, databaseId, schema);
  }
}

export async function syncObjectsToNotion<T extends Schema>(
  objects: SerializableObject<T>[],
  databaseId: string,
  schema: T,
  titleKey: keyof T,
  matchKey: keyof T
) {
  const existingMetroAreaPages = await fetchPagesFromNotionDatabase(databaseId);

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const progress = `${ i + 1 } / ${ objects.length }`;

    // eslint-disable-next-line no-console
    console.log(`☁️  ${ progress }: Syncing object ${ object[titleKey] } to Notion`);

    await createOrUpdatePageInNotion(
      existingMetroAreaPages,
      object,
      databaseId,
      schema,
      // HACK: I couldn't figure out how to get the type set correctly for this.
      matchKey as keyof object
    );
  }
}

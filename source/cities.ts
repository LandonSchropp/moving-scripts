import scrapeIt from "scrape-it";

import { cache } from "./cache";

const CITIES_URL = "https://en.wikipedia.org/wiki/List_of_United_States_cities_by_population";
const METRO_AREAS_URL = "https://en.wikipedia.org/wiki/Metropolitan_statistical_area";

function parseNumber(value: string) {
  return parseInt(value.replace(",", ""), 10);
}

function wikipediaUrl(path: string) {
  return `https://en.wikipedia.org${ path }`;
}

interface City {
  name: string,
  state: string,
  population: number,
  populationDensity: number,
  url: string
}

interface MetroArea {
  name: string,
  population: number,
  url: string
}

interface ExtendedCity {
  city: string,
  state: string,
  population: number,
  populationDensity: number,
  metroArea: string,
  metroAreaPopulation: number,
}

const fetchCities = cache<City[]>("cities", async () => {
  const response = await scrapeIt(CITIES_URL, {
    cities: {
      listItem: "table:nth-of-type(5) tr",
      data: {
        name: {
          selector: "td:nth-of-type(1)",
          convert: value => value.replace(/\[.*\]/, "")
        },
        state: "td:nth-of-type(2)",
        population: {
          selector: "td:nth-of-type(3)",
          convert: parseNumber
        },
        populationDensity: {
          selector: "td:nth-of-type(8)",
          convert: parseNumber
        },
        url: {
          selector: "td:nth-of-type(1) a",
          attr: "href",
          convert: wikipediaUrl
        }
      }
    }
  }) as { data: { cities: City[] } };

  return response.data.cities;
});

export const fetchMetroAreaContent = cache<string>("metro-areas", async (url: string) => {
  const response = await scrapeIt(url, {
    content: "#bodyContent"
  }) as { data: { content: string } };

  return response.data.content;
});

export const fetchMetroAreas = cache<MetroArea[]>("metro-areas", async () => {
  const response = await scrapeIt(METRO_AREAS_URL, {
    metroAreas: {
      listItem: "table:nth-of-type(2) tr",
      data: {
        name: {
          selector: "td:nth-of-type(2)",
          convert: value => value.replace(/,.*/, "").replaceAll("-", "/")
        },
        population: {
          selector: "td:nth-of-type(3)",
          convert: parseNumber
        },
        url: {
          selector: "td:nth-of-type(2) a",
          attr: "href",
          convert: wikipediaUrl
        }
      }
    }
  }) as { data: { metroAreas: MetroArea[] } };

  const { metroAreas } = response.data;

  return Promise.all(
    metroAreas.map(async metroArea => {
      return {
        ...metroArea,
        content: await fetchMetroAreaContent(metroArea.url)
      };
    })
  );
});

export async function fetchExtendedCities() {
  return await fetchMetroAreas();
}

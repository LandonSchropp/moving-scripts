import scrapeIt from "scrape-it";

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
  metroArea: string,
  metroAreaPopulation: number
}

interface ExtendedCity extends City, MetroArea {}

export async function fetchCities() {
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
}

export async function fetchMetroAreas() {
  const response = await scrapeIt(METRO_AREAS_URL, {
    metroAreas: {
      listItem: "table:nth-of-type(2) tr",
      data: {
        metroArea: {
          selector: "td:nth-of-type(2)",
          convert: value => value.replace(/,.*/, "").replaceAll("-", "/")
        },
        metroAreaPopulation: {
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

  return response.data.metroAreas;
}

export async function fetchExtendedCities() {
  return await fetchMetroAreas();
}
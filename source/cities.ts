import scrapeIt from "scrape-it";

const CITIES_URL = "https://en.wikipedia.org/wiki/List_of_United_States_cities_by_population";

type City = {
  city: string,
  state: string,
  population: number
}

export async function fetchCities() {
  const response = await scrapeIt(CITIES_URL, {
    cities: {
      listItem: "table:nth-of-type(5) tr",
      data: {
        city: {
          selector: "td:nth-of-type(1)",
          convert: value => value.replace(/\[.*\]/, "")
        },
        state: "td:nth-of-type(2)",
        population: "td:nth-of-type(3)"
      }
    }
  });

  return response.data as City[];
}

import puppeteer, { ElementHandle, Page } from "puppeteer";

import { cacheJSON } from "./cache";
import { Neighborhood, NeighborhoodGrades } from "./types";
import { parseNumber } from "./utilities";

const URL = "https://www.niche.com/places-to-live/n/$NEIGHBORHOOD-portland-or/";

async function wait(timeout: number) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}

function dasherizeNeighborhood(neighborhood: string) {
  return neighborhood.toLowerCase().replaceAll("'", "").replaceAll(/\W+/g, "-");
}

function nicheUrl(neighborhood: string) {
  return URL.replace("$NEIGHBORHOOD", dasherizeNeighborhood(neighborhood));
}

async function text(page: Page, selector: string) {
  const textSelector = await page.waitForSelector(selector);

  if (!textSelector) {
    // eslint-disable-next-line no-console
    console.log(`😵 The selector '${ selector }' could not be found on the page '${ page.url() }'.`);
    return null;
  }

  return await textSelector.evaluate(element => element.textContent);
}

async function grade(page: Page, selector: string) {
  const gradeText = await text(page, selector);
  return gradeText?.replace("grade", "").trim().replace(" minus", "−") ?? null;
}

export async function fetchNeighborhoodGrades(
  neighborhood: Neighborhood
): Promise<NeighborhoodGrades> {
  const fileName = `niche-${ dasherizeNeighborhood(neighborhood.neighborhood) }.json`;
  const url = nicheUrl(neighborhood.neighborhood);

  const result = await cacheJSON(fileName, async () => {
    /* eslint-disable no-console */
    console.log("⏲  Waiting 30 seconds...");
    await wait(30000);
    console.log("⏲  Done waiting.");
    /* eslint-enable no-console */

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);

    await page.goto(url);

    const failed = (await text(page, "h1"))?.includes("Please verify you are a human");

    if (failed) {
    // eslint-disable-next-line no-console
      console.log(`😵 Failed to scrape page '${ url }'`);

      await browser.close();
      return null;
    }

    const overall = await grade(page, ".overall-grade__niche-grade");
    const schools = await grade(page, ".ordered__list__bucket__item:nth-of-type(1) .niche__grade");
    const safety = await grade(page, ".ordered__list__bucket__item:nth-of-type(2) .niche__grade");
    const nightlife = await grade(
      page,
      ".ordered__list__bucket__item:nth-of-type(4) .niche__grade"
    );
    const family = await grade(page, ".ordered__list__bucket__item:nth-of-type(5) .niche__grade");
    const health = await grade(page, ".ordered__list__bucket__item:nth-of-type(10) .niche__grade");
    const outdoor = await grade(page, ".ordered__list__bucket__item:nth-of-type(11) .niche__grade");
    const commute = await grade(page, ".ordered__list__bucket__item:nth-of-type(12) .niche__grade");

    await browser.close();

    return {
      grade: overall,
      schools,
      safety,
      nightlife,
      family,
      health,
      outdoor,
      commute
    };
  });

  if (result === null) {
    return {
      grade: null,
      schools: null,
      safety: null,
      nightlife: null,
      family: null,
      health: null,
      outdoor: null,
      commute: null
    };
  }

  return result;
}

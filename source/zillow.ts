import { parse } from "csv-parse/sync";
import _ from "lodash";

import { cacheDownload, cacheJSON } from "./cache";
import { MetroArea, MetroAreaHousingPrices } from "./types";

const BASE_URL = "https://files.zillowstatic.com/research/public_csvs/zhvi";

const MID_TIER_URL = `${ BASE_URL }/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv`;
const TOP_TIER_URL = `${ BASE_URL }/Metro_zhvi_uc_sfrcondo_tier_0.67_1.0_sm_sa_month.csv`;
const BOTTOM_TIER_URL = `${ BASE_URL }/Metro_zhvi_uc_sfrcondo_tier_0.0_0.33_sm_sa_month.csv`;
const THREE_BEDROOM_URL = `${ BASE_URL }/Metro_zhvi_bdrmcnt_3_uc_sfrcondo_tier_0.33_0.67_sm_sa_`
  + `month.csv`;

async function downloadData(fileName: string, url: string) {
  const timestamp = Math.floor(new Date().getTime() / 1000);
  const extendedUrl = `${ url }?t=${ timestamp }`;

  const result = await cacheDownload(fileName, extendedUrl);

  return parse(result, { columns: true });
}

async function latestPriceForMetroArea(fileName: string, url: string, metroArea: MetroArea) {
  const data = await downloadData(fileName, url);

  // TODO: This should also match based on *state*
  const match = data.find((region : { RegionName: string }) => {
    return _.some(metroArea.cities, city => {
      return region.RegionName.includes(city);
    });
  })as Record<string, string>;

  if (!match) {
    return null;
  }

  const key = _.last(Object.keys(match));
  return key ? parseInt(match[key], 10) : null;
}

export async function getMetroAreaHousingPrices(metroArea: MetroArea) {
  const metroAreaName = metroArea.cities.join("-").toLowerCase().replaceAll(/\W/g, "-");
  const fileName = `${ metroAreaName }-latest-housing-prices.json`;

  return await cacheJSON(fileName, async () => {
    const topTier = await latestPriceForMetroArea("top-tier.csv", TOP_TIER_URL, metroArea);
    const midTier = await latestPriceForMetroArea("mid-tier.csv", MID_TIER_URL, metroArea);
    const bottomTier = await latestPriceForMetroArea("bottom-tier.csv", BOTTOM_TIER_URL, metroArea);
    const threeBedroom = await latestPriceForMetroArea("three.csv", THREE_BEDROOM_URL, metroArea);

    return {
      topTierHousingPrice: topTier,
      middleTierHousingPrice: midTier,
      bottomTierHousingPrice: bottomTier,
      threeBedroomHousingPrice: threeBedroom
    };
  }) as MetroAreaHousingPrices;
}

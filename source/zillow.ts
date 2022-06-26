import { parse } from "csv-parse/sync";
import _ from "lodash";

import { cache, downloadFileUnlessExists } from "./cache";
import { MetroAreaHousingPrices } from "./types";

const BASE_URL = "https://files.zillowstatic.com/research/public_csvs/zhvi";

const MID_TIER_URL = `${ BASE_URL }/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv`;
const TOP_TIER_URL = `${ BASE_URL }/Metro_zhvi_uc_sfrcondo_tier_0.67_1.0_sm_sa_month.csv`;
const BOTTOM_TIER_URL = `${ BASE_URL }/Metro_zhvi_uc_sfrcondo_tier_0.0_0.33_sm_sa_month.csv`;
const THREE_BEDROOM_URL = `${ BASE_URL }/Metro_zhvi_bdrmcnt_3_uc_sfrcondo_tier_0.33_0.67_sm_sa_`
  + `month.csv`;

async function downloadData(fileName: string, url: string) {
  const timestamp = Math.floor(new Date().getTime() / 1000);

  const result = await downloadFileUnlessExists(
    fileName,
    `${ url }?t=${ timestamp }`
  );

  return parse(result, { columns: true });
}

async function latestPriceForMetroArea(fileName: string, url: string, cities: string[]) {
  const data = await downloadData(fileName, url);

  const match = data.find((region : { RegionName: string }) => {
    return _.some(cities, city => {
      return region.RegionName.includes(city);
    });
  })as Record<string, string>;

  if (!match) {
    return null;
  }

  const key = _.last(Object.keys(match));
  return key ? parseInt(match[key], 10) : null;
}

const getMetroAreaHousingPricesUncached = async (cities: string[]) => {
  const topTier = await latestPriceForMetroArea("top-tier.csv", TOP_TIER_URL, cities);
  const midTier = await latestPriceForMetroArea("mid-tier.csv", MID_TIER_URL, cities);
  const bottomTier = await latestPriceForMetroArea("bottom-tier.csv", BOTTOM_TIER_URL, cities);
  const threeBedroom = await latestPriceForMetroArea("three.csv", THREE_BEDROOM_URL, cities);

  return {
    topTierHousingPrice: topTier,
    middleTierHousingPrice: midTier,
    bottomTierHousingPrice: bottomTier,
    threeBedroomHousingPrice: threeBedroom
  };
};

export const getMetroAreaHousingPrices = cache<MetroAreaHousingPrices>(
  "metro-area-housing-prices",
  getMetroAreaHousingPricesUncached
);

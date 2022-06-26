import _ from "lodash";

import { cacheDownload } from "./cache";
import { stringMatchesMetroArea } from "./metro-areas";
import { MetroArea } from "./types";

const MSA_ELECTION_RESULTS_URL = "https://www.bloomberg.com/toaster/v2/charts/"
  + "557c2ac5147f460495cc75c25309ea66.html";

export async function fetchPoliticalData() {
  const result = await cacheDownload("metro-area-election-results.html", MSA_ELECTION_RESULTS_URL);
  const json = result.match(/\[\[.+?New York.+?\]\]/)?.[0];

  if (!json) {
    throw new Error("Could not extract data from metro area election results!");
  }

  return JSON.parse(json) as string[][];
}

export async function fetchPoliticalDataForMetroArea(metroArea: MetroArea) {
  return _.chain(await fetchPoliticalData())
    .find(row => stringMatchesMetroArea(row[1], metroArea))
    .thru(row => ({
      winnerOf2020Election: row[2],
      winnerOf2020ElectionVotePercentage: parseFloat(row[3])
    }))
    .value();
}

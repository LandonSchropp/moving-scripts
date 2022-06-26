import fakeUserAgent from "fake-useragent";
import fetch from "node-fetch";

// These headers were required to avoid tripping the anti-robot mechanisms on some sites. 🤷
const HEADERS = {
  "upgrade-insecure-requests": "1",
  "user-agent": fakeUserAgent()
};

/**
 * Downloads the contents of a URL. This includes browser headers to avoid tripping anti-robot
 * systems.
 */
export async function download(url: string) {
  return await (await fetch(url, { headers: HEADERS })).text();
}

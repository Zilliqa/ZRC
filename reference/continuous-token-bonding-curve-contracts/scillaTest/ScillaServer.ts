import fetch from "node-fetch";

export class ScillaServer {
  host: string;

  constructor(host: string) {
    this.host = host;
  }

  /**
   *
   * @param testBody body of the test to send
   * @param gaslimit defaults to 100000
   */
  async runTest({
    testBody,
    gaslimit = "100000",
  }: {
    testBody: { [key: string]: string };
    gaslimit?: string;
  }) {
    try {
      const body = {
        ...testBody,
        gaslimit,
      };
      // console.log(body);
      const res = await fetch(`${this.host}/contract/call`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          "content-type": "application/json;charset=UTF-8",
          "sec-ch-ua":
            '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
          "sec-ch-ua-mobile": "?0",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
        },
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        return data;
      } catch (e) {
        console.error(text);
      }
    } catch (e) {
      throw e;
    }
  }
}

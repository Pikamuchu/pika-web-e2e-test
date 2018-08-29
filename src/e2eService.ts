import { Chromeless } from 'chromeless';
import E2eUtils from './e2eUtils';

export default class E2eService {
  private chromeless: Chromeless<{}>;
  private snapshotPath: string;
  private useragent: string;
  private HTTPheaders: any;

  constructor(
    snapshotPath: string,
    useragent: string,
    HTTPheaders: string,
    remote: boolean = false
  ) {
    const options = { launchChrome: false, remote: remote, waitTimeout: 30000 };
    this.chromeless = new Chromeless(options);
    this.snapshotPath = snapshotPath;
    this.useragent = useragent;
    this.HTTPheaders = HTTPheaders ? JSON.parse(HTTPheaders.replace(/'/g,'"')) : {};
  }

  /**
   * Crawls the given url.
   *
   * @param url
   * @param chunk
   */
  async processData(url: string, dataFile: string, chunk: number) {
    // Do some sleep in order to assure chrome startup
    await E2eUtils.sleep();
    // Parsing url
    
    let testData = [];
    if (url) {
      console.log('* Opening url ' + url);
      testData.push(url);
    }
    if (dataFile) {
      console.log('* Opening data file ' + dataFile + ' and parsing e2e endpoints');
      const testDataFile = await E2eUtils.readTestData(dataFile);
      testData.push(...testDataFile);
    }
    if (testData) {
      // filter links
      const testEndpoints = testData.filter(
        endpoint => endpoint && endpoint.length > 0
      );
      // Process links in chunks
      let i, j;
      console.log(`* Crawling ${testEndpoints.length} test Urls from ${testData.length} links found.`);
      for (i = 0, j = testEndpoints.length; i < j; i += chunk) {
        // Preparing chunk
        const start = i;
        const end = start + chunk < testEndpoints.length ? start + chunk : testEndpoints.length;
        const testUrlChunk = testEndpoints.slice(start, end);
        // Executing test data chunk
        console.log(`* Processing chunk ${i / chunk} size ${testUrlChunk.length} total processed  ${i}.`);
        await this.multiTaskOpenUrl(testUrlChunk);
      }
    }
  }

  /**
   * Ends crwaler session.
   */
  async endService() {
    await this.chromeless.end();
  }

  protected async multiTaskOpenUrl(testUrls: string[]) {
    try {
      // Creating tasks promises
      let openUrlsPromises = testUrls.map(url => this.openUrl(url));
      // Executing tasks
      if (openUrlsPromises && openUrlsPromises.length) {
        const screenshots = await Promise.all(openUrlsPromises);
        // Print screenshots
        screenshots.forEach(screenshot => console.log(screenshot));
      }
    } catch (error) {
      console.error('Unexpected error ocurred: ' + error);
    }
  }

  protected openUrl(url: string): Promise<string> {
    // Opening url on headless chrome
    console.log(`* Opening Url ${url}.`);
    const endpoint = url.split(' ');
    if (endpoint && endpoint.length == 1) {
      return new Promise((resolve, reject) => {
        this.chromeless
          .goto(url)
          .setUserAgent(this.useragent)
          .setExtraHTTPHeaders(this.HTTPheaders)
          .screenshot(undefined, {
            filePath: E2eUtils.toSnapshotFilePath(url, this.snapshotPath)
          })
          .then(async (screenshot: any) => {
            resolve(screenshot);
          })
          .catch((err: any) => reject(err));
      });
    } else {
      return E2eUtils.openEndpoint(endpoint[0], endpoint[1], endpoint.length >= 3 ? endpoint[2] : undefined);
    }
  }
}

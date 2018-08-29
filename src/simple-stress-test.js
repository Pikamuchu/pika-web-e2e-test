const { Chromeless } = require('chromeless');
const fs = require('fs');
const util = require('util');

// Convert fs.readFile into Promise version of same
const readFile = util.promisify(fs.readFile);

// Constants
var chunk = 2;
var dataFile = 'data/test-samples.txt';

async function run() {
  console.log('*********** Starting Stress test **************');
  console.log('*');

  // Configure test
  setupParams();
  
  console.log("* Chunks: " + chunk);
  console.log("* Data file: " + dataFile);
  console.log('*');

  // Opening headless chrome session
  const masterChromeless = new Chromeless();
  // Needed to wait for Chrome to start up
  await sleep();

  try {
    // Read test data
    console.log('* Reading test data file ' + dataFile);
    const testData = await readTestData(dataFile);
    if (testData) {
      // Split data in chunks
      let i, j;
      const testUrlArray = testData.split('\n');
      console.log('* Total test urls ' + testUrlArray.length);
      for (i = 0, j = testUrlArray.length; i < j; i += chunk) {
        // Preparing chunk
        const start = i;
        const end = start + chunk < testUrlArray.length ? start + chunk : testUrlArray.length;
        const testUrlChunk = testUrlArray.slice(start, end);
        // Executing test data chunk
        console.log('* Processing chunk ' + (i/chunk) + ' size ' + testUrlChunk.length + ' total processed ' + i);
        await multiTaskOpenUrl(testUrlChunk);
      }
    }
  } catch (error) {
    console.error("Unexpected error ocurred: " + error);
  } finally {
    // Closing chrome session
    await masterChromeless.end();
    console.log('*');
    console.log('*********** Stress test end **************');
  }
}

function sleep() {
  return new Promise(resolve => {
    setTimeout(resolve, 2000);
  });
}

function setupParams() {
  for (i = 0; i < process.argv.length; i++) {
    if (i === 2 && process.argv[2]) {
      chunk = Number(process.argv[2]);
    }
    if (i === 3 && process.argv[3]) {
      dataFile = process.argv[3];
    }
  }
}

function readTestData(file) {
  return readFile(file, { encoding: 'utf8' });
}

async function multiTaskOpenUrl(testUrls = []) {
  try {
    // Creating tasks promises
    let openUrlsPromises = testUrls.filter(url => url && url.length > 0).map(url => openUrl(url));
    // Executing tasks
    if (openUrlsPromises && openUrlsPromises.length) {
      const screenshots = await Promise.all(openUrlsPromises);
      // Print screenshots
      screenshots.forEach(screenshot => console.log(screenshot));
    }
  } catch (error) {
    console.error("Unexpected error ocurred: " + error);
  }
}

function openUrl(url) {
  // Opening url on headless chrome
  return new Promise((resolve, reject) => {
    const chromeless = new Chromeless({ launchChrome: false });
    chromeless
      .goto(url)
      .screenshot()
      .then(async screenshot => {
        await chromeless.end();
        resolve(screenshot);
      })
      .catch(err => reject(err));
  });
}

run();

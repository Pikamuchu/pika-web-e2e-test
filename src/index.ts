import { Command, flags } from '@oclif/command';
import E2eService from './e2eService';
import ChromeService from './chromeService';
import E2eUtils from './e2eUtils';

class E2eTest extends Command {
  static DEFAULT_CHUNK = 1;
  static DEFAULT_PATH_SNAPSHOTS = './snapshots';
  static DEFAULT_DATA_FILE = './data/test-samples.txt';
  static DEFAULT_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36';

  static description = 'Pika web e2e test script';

  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    pathSnapshots: flags.string({
      char: 'p',
      description: 'Base path for snapshots',
      default: E2eTest.DEFAULT_PATH_SNAPSHOTS
    }),
    dataFile: flags.string({
      char: 'd',
      description: 'Data file e2e',
      default: E2eTest.DEFAULT_DATA_FILE
    }),
    HTTPheaders: flags.string({
      char: 'e',
      description: 'HTTP header to use on url request',
    }),
    chunk: flags.string({
      char: 'c',
      description: 'Number of concurrent url calls',
      default: `${E2eTest.DEFAULT_CHUNK}`
    }),
    notLaunchChrome: flags.boolean({ char: 'n', description: `Don't auto-launch chrome (local)` }),
    remote: flags.boolean({ char: 'r', description: 'Use remote chrome process' }),
    useragent: flags.string({
      char: 'u',
      description: 'Useragent of the browser',
      default: E2eTest.DEFAULT_USER_AGENT
    })
  };

  static args = [{ name: 'url', required: false, description: 'Url to open' }];

  async run() {
    const { args, flags } = this.parse(E2eTest);

    console.log('*********** Starting web e2e test **************');
    console.log('*');

    let exitCode = 0;
    let chromeService;
    let e2eService;

    try {

      if (!args.url && !flags.dataFile) {
        throw 'An url or a dataFile must be informed!';
      }

      // Starting Chrome
      if (!flags.notLaunchChrome) {
        chromeService = new ChromeService();
        await chromeService.start();
      }

      // Opening e2e session
      e2eService = new E2eService(flags.pathSnapshots, flags.useragent, flags.HTTPheaders, flags.remote);

      // Read test data
      await e2eService.processData(args.url, flags.dataFile, flags.chunk ? parseInt(flags.chunk) : E2eTest.DEFAULT_CHUNK);

    } catch (error) {
      exitCode = 2;
      console.error('An error ocurred:');
      console.error(error);
    } finally {
      // Closing e2e session
      if (e2eService) {
        await e2eService.endService();
      }
      // Closing chrome session
      if (chromeService) {
        await chromeService.stop();
      }
    }

    console.log('*');
    console.log('*********** E2e test end **************');

    process.exit(exitCode);
  }
}

export = E2eTest;

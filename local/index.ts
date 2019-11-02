import puppeteer from 'puppeteer'
import axios from 'axios'
import config from './batch-config.json'

interface Pixel {
  date: string;
  quantity: string;
}

const askenUrl = 'http://asken.jp/login';

(async () => {
  // config data check
  if (config.startDate > config.endDate) {
    console.log('ERROR: start date should be smaller than end date');
    return;
  }

  // prepare puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // enable console.log in puppeterr's eval functions
  page.on('console', consoleMessageObject => {
    if (consoleMessageObject.type() !== 'warning') {
        console.debug(consoleMessageObject.text())
    }
  });

  // login
  await page.goto(askenUrl);
  await page.type('input[id="CustomerMemberEmail"]', config.askenEmail);
  await page.type('input[id="CustomerMemberPasswdPlain"]', config.askenPass);
  await page.click('#SubmitSubmit');
  await page.waitFor(2000);
  console.log('logged in');

  while (true) {
    // collect points
    const points: Pixel[] = await page.$$eval('.point_link', (pl, config) => {
      return pl.map(p => {
        // actual score is in text content and date info is in href attribute
        // e.g. <a href="https://www.asken.jp/wsp/comment/2019-10-14" class="point_link">67点</a>
        const pText = p.textContent;
        const pHref = p.getAttribute('href');

        if (pText != null && pHref != null) {
          const quantity = pText.replace(/点/g, '');
          const date = pHref.substr(pHref.length - 10).replace(/-/g, '');

          if (date < config.startDate || config.endDate < date) {
            // if obtained date is NOT in the rage of target date, skip the point
            return;
          }

          return {
            date: date,
            quantity: quantity
          };
        }
      }).filter((p: Pixel | undefined): p is Pixel => p != undefined);
    }, config);

    for (let p of points) {
      const graphUrl = 'https://pixe.la/v1/users/' + config.pixelaUser + '/graphs/' + config.pixelaGraphId + '/' + p.date;
      console.log(`${p.quantity}, ${p.date} will be recorded to ${graphUrl}`);
      try {
        // record to pixela graph
        const res = await axios({
          method: 'put',
          url: graphUrl,
          headers: { 'X-USER-TOKEN': config.pixelaToken },
          data: { quantity: p.quantity }
        });
        console.log(`status ${res.status}: ${res.statusText}`);
      } catch (error) {
        console.log(error);
      }
    }

    const firstDay = await page.$eval('.calendar_body_0 > .val_point > a', p => {
      const pHref = p.getAttribute('href');
      return (pHref != null) ? pHref.substr(pHref.length - 10).replace(/-/g, '') : null;
    });

    // move to previous month if needed
    if (firstDay != null && config.startDate < firstDay) {
      console.log('go to previous month')
      await page.click('#calendar_back')
      await page.waitFor(1000);
    } else {
      console.log('all done')
      break;
    }
  }

  //await page.screenshot({path: 'test.png'})
  await browser.close();
})();
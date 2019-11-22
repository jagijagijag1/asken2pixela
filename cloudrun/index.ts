import puppeteer from 'puppeteer';
import express from "express"; 
import axios from 'axios';

const app = express();

// environment variables
const askenUrl = process.env.ASKEN_URL!;
const askenEmail = process.env.ASKEN_EMAIL!;
const askenPass = process.env.ASKEN_PASS!;
const pixelaUser = process.env.PIXELA_USER!;
const pixelaGraphId = process.env.PIXELA__GRAPH!;
const pixelaToken = process.env.PIXELA_TOKEN!;

interface Pixel {
  date: string;
  quantity: string;
}

app.get('/', async (req, res) => {
  console.log('Request received');

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
  await page.type('input[id="CustomerMemberEmail"]', askenEmail);
  await page.type('input[id="CustomerMemberPasswdPlain"]', askenPass);
  await page.click('#SubmitSubmit');
  await page.waitFor(2000);
  console.log('logged in');

  const yesterday: string = yesterdayString();

  // if executing first day, the target data is not displayed so we need to back to the previous month
  //if (yesterday.endsWith("01")) {
  if (isFirstDay()) {
    console.log('go to previous month')
    await page.click('#calendar_back')
    await page.waitFor(1000);
  }

  // collect yesterday's point (expected `page.$$eval` returns only one element)
  const points: Pixel[] = await page.$$eval('.point_link', (pl, yesterday) => {
    return pl.map(p => {
      // actual score is in text content and date info is in href attribute
      // e.g. <a href="https://www.asken.jp/wsp/comment/2019-10-14" class="point_link">67ç‚¹</a>
      const pText = p.textContent;
      const pHref = p.getAttribute('href');

      if (pText != null && pHref != null) {
        const quantity = pText.replace(/\u70B9/g, '');
        const date = pHref.substr(pHref.length - 10).replace(/-/g, '');
        //console.log(`${date}(${typeof date}), ${quantity} | ${yesterday}(${typeof yesterday})`);

        if (date == yesterday) {
          const pixel: Pixel = { date: date, quantity: quantity };
          console.log(`${pixel}: ${pixel.date}, ${pixel.quantity}`)
          return pixel;
        }
      }
    }).filter((p: Pixel | undefined): p is Pixel => p != undefined);
  }, yesterday);

  // if no data at yesterday, return error response
  if (points.length == 0) {
    console.log(`There is no data at ${yesterday}`);
    res.status(500)
    res.send(`There is no data at ${yesterday}`);
    return;
  }

  // record to pixela graph
  const point = points[0];
  const graphUrl = 'https://pixe.la/v1/users/' + pixelaUser + '/graphs/' + pixelaGraphId + '/' + point.date;
  console.log(`${point.quantity}, ${point.date} will be recorded to ${graphUrl}`);
  try {
    // record to pixela graph
    const res = await axios({
      method: 'put',
      url: graphUrl,
      headers: { 'X-USER-TOKEN': pixelaToken },
      data: { quantity: point.quantity }
    });
    console.log(`status ${res.status}: ${res.statusText}`);
  } catch (error) {
    console.log(error);
  }

  // post-processing
  await page.close();
  res.send(`Crawled ${askenUrl} & recorded {${point.quantity}, ${point.date}}  to ${graphUrl}`);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('asken2pixela listening on port', port);
});

// generate string of yesterday's date & require month change or not
function yesterdayString(): string {
    const dateObj =  new Date();
    dateObj.setDate(dateObj.getDate() - 1);
    const yyyy = dateObj.getFullYear();
    const MM = ('0' + (dateObj.getMonth() + 1)).slice(-2)
    const dd = ('0' + dateObj.getDate()).slice(-2) 

    return yyyy + MM + dd;
}

function isFirstDay(): boolean {
    const dateObj =  new Date();
    const todaydd = ('0' + dateObj.getDate()).slice(-2) 

    return todaydd == '01';
}
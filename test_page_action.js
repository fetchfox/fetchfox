import { chromium } from "playwright-extra";
import { logger } from "./src/log/logger.js";
import { Document } from "./src/index.js";
// import { PageAction } from "./src/fetch/PageAction.js";
// import { PlaywrightFetcher } from "./src/fetch/PlaywrightFetcher.js";
import { getFetcher } from "./src/fetch/index.js";
import { FetchInstructions } from "./src/fetch/FetchInstructions.js";

const urls = [
    {url: "https://homesmart.com/real-estate-agents/hs0095", prompt: "Click on all real estate agent names"},
    {url: "https://pokemondb.net/pokedex/national", prompt: "Click on all pokemon"},
    {url: "https://www.premierleague.com/stats", prompt: "Click on player names"},
    {url: "https://ffcloud.s3.us-west-2.amazonaws.com/misc/homesmart-sample.html", prompt: "Click on the real estate agent names"},
    {url: "https://www.psychologytoday.com/us/therapists/tx/collin-county?category=in-person&spec=1996&spec=407&spec=327", prompt: "Click on all therapists"},
    {url: "https://www.woolworths.com.au/shop/browse/specials/half-price/health-wellness", prompt: "Click on product listings"},
    {url: "https://luxury.kw.com/agent/search/TX/Austin?specialization=Luxury", prompt: "Click on agent names"},
];

// const browser = await chromium.connect({
//     wsEndpoint: 'wss://brd-customer-hl_e9028181-zone-scraping_browser1:96m97ovmklqe@brd.superproxy.io:9222',
// });

const browser = await chromium.launch({ headless: false });
// const page = await browser.newPage();

// await page.goto(url);

const { url, prompt } = urls[1];

const fetcher = getFetcher();
const doc = await fetcher.first(url);

const instructions = new FetchInstructions(doc, [prompt]);

const l = [];
for await (const val of instructions.fetch()) {
    // console.log(val);
    l.push(val);
}



const page = await browser.newPage();

try {
    await page.goto(url);
    for (const instruction of l) {
    const { command, arg } = instruction;
    const elements = await findElements(arg, page);
        
    for (const ele of elements) {
        if (command === "click") {
            const newPage = await browser.newPage();
            await newPage.goto(url, { waitUntil: 'domcontentloaded' });
            await click(ele, newPage);

            const htmlContent = await newPage.content();
            
            // Convert htmlContent to Document instance
            const doc = new Document();
            await doc.read(
                {
                    text: async () => htmlContent,
                    url: () => url,
                    status: 200,
                    headers: {}
                }, 
                newPage.url,
                null,
                { url }
            );

            // console.log(doc)
            // yield doc;
            await new Promise(ok => setTimeout(ok, 3 * 1000));
            await newPage.close();
        }
    }
}
} catch (e) {
    logger.error(`${this} Error executing instruction: ${e}`);
} finally {
    await page.close();
}


async function findElements(selector, page) {
    if (!selector.startsWith('text=') && !selector.startsWith('css=')) {
      logger.warn(`${this} Invalid selector: ${selector}`);
      return [];
    }
  
    // Get all the matching elements
    const elements = await page.locator(selector).all();
    if (!elements.length) {
      logger.warn(`${this} No elements found for selector=${selector}`);
      return [];
    }
  
    return elements;
}

async function click(ele, page) {
    await ele.scrollIntoViewIfNeeded();
    return ele.click();
}
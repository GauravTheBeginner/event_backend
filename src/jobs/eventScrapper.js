// Event Scraper - Direct to Database (No JSON files)
import cron from 'node-cron';
import puppeteer from 'puppeteer';
import { setTimeout } from 'node:timers/promises';
import prisma from '../db/client.js';
import { bulkCreateEvents } from '../services/event.service.js';

// ============ SCRAPER FUNCTIONS ============
async function autoScroll(page, scrollDelay = 1000) {
  await page.evaluate(async (delay) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let lastHeight = document.body.scrollHeight;

    while (true) {
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(delay);
      const newHeight = document.body.scrollHeight;
      if (newHeight === lastHeight) break;
      lastHeight = newHeight;
    }
  }, scrollDelay);
}

async function getEventLinks(page) {
  const MAIN_URL = 'https://www.district.in/events/';

  await page.goto(MAIN_URL, {
    waitUntil: 'networkidle2',
    timeout: 0 // use global timeout
  });

  await page.waitForSelector('body', { timeout: 120000 });
  console.log('📄 Main events listing loaded');

  await autoScroll(page, 1500);
  await setTimeout(2000);

  const links = await page.$$eval(
    '.dds-grid.dds-gap-x-3.md\\:dds-gap-x-4.dds-grid-cols-1.dds-gap-y-8.md\\:dds-grid-cols-2.lg\\:dds-grid-cols-3.xl\\:dds-grid-cols-4.dds-justify-items-center.lg\\:dds-justify-items-start a',
    anchors => anchors
      .map(a => a.href)
      .filter(h => typeof h === 'string' && h.includes('/events/'))
  );

  const uniq = [...new Set(links)];
  console.log(`🔗 Found ${uniq.length} event URLs`);
  return uniq;
}

async function scrapeEvent(page, url) {
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 0
  });

  await page.waitForSelector('body', { timeout: 120000 }).catch(() => {});

  const data = { url };

  data.banner_image = await page.$eval('img[data-ref="edp_event_banner_image"]', img => img.src).catch(_ => null);
  data.title = await page.$eval('[data-ref="edp_event_title_desktop"]', el => el.innerText.trim()).catch(_ => null);
  data.category = await page.$eval('[data-ref="edp_event_category_desktop"]', el => el.innerText.trim()).catch(_ => null);
  data.date_time = await page.$eval('[data-ref="edp_event_datestring_desktop"]', el => el.innerText.trim()).catch(_ => null);
  data.venue = await page.$eval('[data-ref="edp_event_venue_desktop"]', el => el.innerText.trim()).catch(_ => null);
  data.price = await page.$eval('[data-ref="edp_price_string_desktop"]', el => el.innerText.trim()).catch(_ => null);
  data.about = await page.$eval('#about', el => el.innerText.trim()).catch(_ => null);
  data.venue_details = await page.$eval('.css-49j8g3', el => el.innerText.trim()).catch(_ => null);

  return data;
}

// ============ JSON TO DATABASE CONVERSION ============
function parseAboutExtras(aboutText) {
  const res = { language: '', duration: '', tickets_needed_for: '' };
  if (!aboutText || typeof aboutText !== 'string') return res;

  const lines = aboutText.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^Language[:]?$/i.test(l)) {
      if (lines[i + 1]) res.language = lines[i + 1];
    } else if (/^Duration[:]?$/i.test(l)) {
      if (lines[i + 1]) res.duration = lines[i + 1];
    } else if (/^Tickets?\s*Needed\s*For[:]?$/i.test(l)) {
      if (lines[i + 1]) res.tickets_needed_for = lines[i + 1];
    }
  }
  return res;
}

async function convertScrapedToDbFormat(scrapedEvents) {
  console.log('\n📦 Converting scraped data to database format...');
  const dbEvents = [];

  for (const event of scrapedEvents) {
    if (!event.banner_image || !event.title) {
      console.log(`⚠️  Skipping event without image or title: ${event.url}`);
      continue;
    }

    const extras = parseAboutExtras(event.about);

    const eventData = {
      eventName: event.title,
      eventDescription: event.about,
      eventType: event.category,
      eventDates: event.date_time,
      eventLocation: event.venue,
      locationDataPCityName: 'Gurugram',
      locationDataPStateKey: 'Haryana',
      eventPlaceAddress: event.venue_details || event.venue,
      eventPlaceName: event.venue,
      eventAggregateOfferOfferPrice: event.price || 'To Be Announced',
      language: extras.language,
      duration: extras.duration,
      ticketsNeededFor: extras.tickets_needed_for,
      image: event.banner_image,
      bookingUrl: event.url,
      source: 'scrapper'
    };

    dbEvents.push(eventData);
  }

  console.log(`✅ Converted ${dbEvents.length} events to database format`);
  return dbEvents;
}

// ============ MAIN WORKFLOW ============
async function runFullWorkflow() {
  console.log('🚀 Starting Event Scraper Workflow (Direct to Database)\n');

  // Load existing events
  console.log('📂 Loading existing events from database...');
  const existingEvents = await prisma.event.findMany({
    select: { bookingUrl: true }
  });
  const existingUrls = new Set(existingEvents.map(event => event.bookingUrl).filter(Boolean));
  console.log(`📂 Found ${existingUrls.size} existing events in database\n`);

  // Launch browser with cloud-safe args
  console.log('🕷️  Starting web scraper...\n');
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
    ]
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(120000);
  await page.setViewport({ width: 1280, height: 800 });

  const links = await getEventLinks(page);

  const newEvents = [];
  let skippedCount = 0;
  let idx = 0;

  for (const url of links) {
    idx++;

    if (existingUrls.has(url)) {
      skippedCount++;
      console.log(`⏭️  [${idx}/${links.length}] Skipped: ${url.substring(0, 60)}...`);
      continue;
    }

    try {
      const ev = await scrapeEvent(page, url);
      newEvents.push(ev);
      console.log(`✨ [${idx}/${links.length}] NEW: ${ev.title}`);
    } catch (err) {
      console.warn(`❌ [${idx}/${links.length}] Error scraping ${url}:`, err.message);
    }
  }

  await browser.close();

  if (newEvents.length > 0) {
    const dbEvents = await convertScrapedToDbFormat(newEvents);
    if (dbEvents.length > 0) {
      console.log('\n📤 Uploading events to database...');
      const systemUserId = process.env.SYSTEM_USER_ID || '643f52ac-3020-4a89-af93-131e01d3e648';
      const bulkResult = await bulkCreateEvents(systemUserId, dbEvents);
      console.log(`   ✅ ${bulkResult.message}`);
    }
  } else {
    console.log('\n📊 No new events to process');
  }

  const totalEventsInDb = await prisma.event.count();
  console.log('\n' + '='.repeat(50));
  console.log('📈 WORKFLOW SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total events in database: ${totalEventsInDb}`);
  console.log(`New events scraped: ${newEvents.length}`);
  console.log(`Existing events skipped: ${skippedCount}`);
  console.log('='.repeat(50));
  console.log('\n✅ Workflow completed successfully!');

  await prisma.$disconnect();
}

// Schedule scraper job every 2 hours
export const scheduleScraperJob = () => {
  // Run every 10 minutes: */10 * * * *
  // For testing, you can use '*/1 * * * *' to run every minute
  const schedule = '0 */2 * * *';
  
  cron.schedule(schedule, runFullWorkflow, {
    timezone: process.env.TZ || 'UTC'
  });
  
  console.log(`Scheduled scraper job to run every 2 hours: ${schedule}`);
  
  // Run immediately on startup
  runFullWorkflow().catch(error => {
    console.error('❌ Scheduled scraper job failed:', error);
  });
};

export default scheduleScraperJob;

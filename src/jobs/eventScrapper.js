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
  await page.goto(MAIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('📄 Main events listing loaded');

  await autoScroll(page, 1500);
  await setTimeout(2000);

  const links = await page.$$eval(
    '.dds-grid.dds-gap-x-3.md\\:dds-gap-x-4.dds-grid-cols-1.dds-gap-y-8.md\\:dds-grid-cols-2.lg\\:dds-grid-cols-3.xl\\:dds-grid-cols-4.dds-justify-items-center.lg\\:dds-justify-items-start a',
    anchors => anchors.map(a => a.href).filter(h => typeof h === 'string' && h.includes('/events/'))
  );
  const uniq = [...new Set(links)];
  console.log(`🔗 Found ${uniq.length} event URLs`);
  return uniq;
}

async function scrapeEvent(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('body').catch(() => {});

  const data = { url };

  data.banner_image = await page.$eval('img[data-ref="edp_event_banner_image"]', img => img.src)
    .catch(_ => null);
  data.title = await page.$eval('[data-ref="edp_event_title_desktop"]', el => el.innerText.trim())
    .catch(_ => null);
  data.category = await page.$eval('[data-ref="edp_event_category_desktop"]', el => el.innerText.trim())
    .catch(_ => null);
  data.date_time = await page.$eval('[data-ref="edp_event_datestring_desktop"]', el => el.innerText.trim())
    .catch(_ => null);
  data.venue = await page.$eval('[data-ref="edp_event_venue_desktop"]', el => el.innerText.trim())
    .catch(_ => null);
  data.price = await page.$eval('[data-ref="edp_price_string_desktop"]', el => el.innerText.trim())
    .catch(_ => null);
  data.about = await page.$eval('#about', el => el.innerText.trim())
    .catch(_ => null);
  data.venue_details = await page.$eval('.css-49j8g3', el => el.innerText.trim())
    .catch(_ => null);

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
      if (lines[i+1]) res.language = lines[i+1];
    } else if (/^Duration[:]?$/i.test(l)) {
      if (lines[i+1]) res.duration = lines[i+1];
    } else if (/^Tickets?\s*Needed\s*For[:]?$/i.test(l)) {
      if (lines[i+1]) res.tickets_needed_for = lines[i+1];
    }
  }
  return res;
}

// Helper function to extract city from venue string
function extractCity(venue) {
  if (!venue) return 'Unknown';
  
  // Common patterns: "Venue Name, City" or just extract last part after comma
  const parts = venue.split(',').map(p => p.trim());
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  return venue;
}

// Convert scraped JSON data directly to database format
async function convertScrapedToDbFormat(scrapedEvents) {
  console.log('\n📦 Converting scraped data to database format...');
  
  const dbEvents = [];
  
  for (const event of scrapedEvents) {
    // Skip events without required fields
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

  // 1. Load existing events from database
  console.log('📂 Loading existing events from database...');
  const existingEvents = await prisma.event.findMany({
    select: {
      bookingUrl: true
    }
  });
  const existingUrls = new Set(existingEvents.map(event => event.bookingUrl).filter(Boolean));
  console.log(`📂 Found ${existingUrls.size} existing events in database\n`);

  // 2. Run scraper
  console.log('🕷️  Starting web scraper...\n');
  const browser = await puppeteer.launch({ 
    headless: "new", 
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const links = await getEventLinks(page);
  
  const newEvents = [];
  let skippedCount = 0;

  let idx = 0;
  for (const url of links) {
    idx++;
    
    if (existingUrls.has(url)) {
      skippedCount++;
      console.log(`⏭️  [${idx}/${links.length}] Skipped (exists): ${url.substring(0, 60)}...`);
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

  // 3. Convert and upload directly to database
  if (newEvents.length > 0) {
    const dbEvents = await convertScrapedToDbFormat(newEvents);
    
    if (dbEvents.length > 0) {
      console.log('\n📤 Uploading events to database...');
      
      // Use a default admin user ID for scraper uploads
      // You may want to configure this or create a system user
      const systemUserId_railway = '6608e2ad-5dce-4386-8705-cf1881c90d6a';
      const systemUserId = '3bf81b58-3881-4885-8328-6e932907d4f2';

      const bulkResult = await bulkCreateEvents(systemUserId, dbEvents);
      console.log(`   ✅ ${bulkResult.message}`);
    
      if (bulkResult.results.failed.length > 0) {
        console.log('\n⚠️  Failed uploads:');
        bulkResult.results.failed.forEach(fail => {
          console.log(`   - Row ${fail.row}: ${fail.eventName} - ${fail.error}`);
        });
      }
    } else {
      console.log('\n⚠️  All scraped events were filtered out (missing images or titles)');
    }
  } else {
    console.log('\n📊 No new events to process');
  }

  // 4. Summary
  const totalEventsInDb = await prisma.event.count();
  console.log('\n' + '='.repeat(50));
  console.log('📈 WORKFLOW SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total events in database: ${totalEventsInDb}`);
  console.log(`New events scraped: ${newEvents.length}`);
  console.log(`Existing events skipped: ${skippedCount}`);
  console.log('='.repeat(50));
  console.log('\n✅ Workflow completed successfully!');
  
  // Close Prisma connection
  await prisma.$disconnect();
}

// // Run the workflow
// runFullWorkflow().catch(err => {
//   console.error('❌ Workflow failed:', err);
//   process.exit(1);
// });

// Schedule scraper job to run every 30 minutes
export const scheduleScraperJob = () => {
  // Run every 2 hours = */2 * * * *  
  const schedule = '*/2 * * * *';
  
  cron.schedule(schedule, () => {
    console.log('\n🕒 Scheduled scraper job started');
    runFullWorkflow().catch(err => {
      console.error('❌ Scheduled scraper job failed:', err);
    });
  });
};

export default scheduleScraperJob;
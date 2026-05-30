import cron from 'node-cron';
import puppeteer from 'puppeteer';
import { PriceModel } from '../models/Price.js';
import { FoodItemModel } from '../models/FoodItem.js';
import { StoreModel } from '../models/Store.js';
import { PriceSource } from '@shared/types';

interface ScrapingConfig {
  name: string;
  url: string;
  selectors: {
    productTitle: string;
    price: string;
    image?: string;
  };
  enabled: boolean;
}

const scrapingConfigs: ScrapingConfig[] = [
  {
    name: 'Walmart',
    url: 'https://www.walmart.com',
    selectors: {
      productTitle: '[data-automation-id="product-title"]',
      price: '[data-automation-id="product-price"]',
      image: '[data-testid="product-image"] img',
    },
    enabled: true,
  },
  {
    name: 'Target',
    url: 'https://www.target.com',
    selectors: {
      productTitle: '[data-test="product-title"]',
      price: '[data-test="product-price"]',
      image: '[data-test="product-image"] img',
    },
    enabled: true,
  },
  // Add more store configurations as needed
];

export function startPriceScraping(): void {
  console.log('Starting price scraping service...');

  // Run scraping every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('Starting scheduled price scraping...');
    await scrapeAllStores();
  });

  // Also run immediately on startup
  setTimeout(async () => {
    await scrapeAllStores();
  }, 5000);
}

async function scrapeAllStores(): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const config of scrapingConfigs) {
      if (!config.enabled) continue;
      
      console.log(`Scraping ${config.name}...`);
      await scrapeStore(browser, config);
    }
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
}

async function scrapeStore(browser: puppeteer.Browser, config: ScrapingConfig): Promise<void> {
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navigate to the store's main page
    await page.goto(config.url, { waitUntil: 'networkidle2' });
    
    // This is a simplified example - in reality, you'd need to:
    // 1. Navigate to specific product pages
    // 2. Handle pagination
    // 3. Extract product information
    // 4. Match products with existing food items
    
    console.log(`Scraping completed for ${config.name}`);
  } catch (error) {
    console.error(`Error scraping ${config.name}:`, error);
  }
}

// Manual scraping function for specific products
export async function scrapeProductPrice(productUrl: string, storeName: string): Promise<any> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto(productUrl, { waitUntil: 'networkidle2' });
    
    // Extract product information
    const productInfo = await page.evaluate((selectors) => {
      const titleElement = document.querySelector(selectors.productTitle);
      const priceElement = document.querySelector(selectors.price);
      const imageElement = document.querySelector(selectors.image);
      
      return {
        name: titleElement?.textContent?.trim() || '',
        price: priceElement?.textContent?.trim() || '',
        imageUrl: imageElement?.getAttribute('src') || '',
      };
    }, scrapingConfigs.find(c => c.name === storeName)?.selectors || {});

    return productInfo;
  } catch (error) {
    console.error('Error scraping product:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

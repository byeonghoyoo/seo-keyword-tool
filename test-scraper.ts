// Test script to verify scraping functionality
import { webScraper } from './src/lib/scraper';

async function testScraping() {
  try {
    console.log('Testing web scraping with URL: https://m.rubyps.co.kr/');
    
    const result = await webScraper.scrapeUrl('https://m.rubyps.co.kr/');
    
    console.log('Scraping Results:');
    console.log('Title:', result.title);
    console.log('Description:', result.description);
    console.log('Keywords found:', result.keywords.length);
    console.log('First 10 keywords:', result.keywords.slice(0, 10));
    console.log('H1 tags:', result.headings.h1);
    console.log('H2 tags:', result.headings.h2.slice(0, 5));
    
    return result;
  } catch (error) {
    console.error('Scraping failed:', (error as Error).message);
    throw error;
  }
}

testScraping()
  .then(() => {
    console.log('✅ Scraping test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Scraping test failed:', error);
    process.exit(1);
  });
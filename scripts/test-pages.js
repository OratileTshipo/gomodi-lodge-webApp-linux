const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const urls = ['http://localhost:3001/', 'http://localhost:3001/corporate', 'http://localhost:3001/events'];
  const results = [];

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const analysis = await page.evaluate(() => {
      // Find header element (header tag or nav or first fixed/sticky element at top)
      const header = document.querySelector('header') || document.querySelector('nav') || document.querySelector('[role="banner"]');
      let headerRect = header ? header.getBoundingClientRect() : null;
      
      // If no standard header tag, check elements near top
      if (!headerRect || headerRect.height === 0) {
        const topEl = document.elementFromPoint(100, 10);
        if (topEl) {
          const possibleHeader = topEl.closest('header, nav, div');
          if (possibleHeader) headerRect = possibleHeader.getBoundingClientRect();
        }
      }

      // Find hero section or first major image/section
      const hero = document.querySelector('section') || document.querySelector('.hero') || document.querySelector('main > div:first-child');
      const heroRect = hero ? hero.getBoundingClientRect() : null;

      // Find hero image/photo inside hero or page
      const heroImg = document.querySelector('section img') || document.querySelector('.hero img') || document.querySelector('main img') || document.querySelector('img');
      const imgRect = heroImg ? heroImg.getBoundingClientRect() : null;

      // Find hero text elements (h1, p in hero)
      const heroText = document.querySelector('h1') || document.querySelector('.hero h1') || document.querySelector('section h1');
      const textRect = heroText ? heroText.getBoundingClientRect() : null;

      return {
        url: window.location.href,
        header: headerRect ? { top: headerRect.top, bottom: headerRect.bottom, height: headerRect.height } : null,
        hero: heroRect ? { top: heroRect.top, bottom: heroRect.bottom, height: heroRect.height } : null,
        image: imgRect ? { top: imgRect.top, bottom: imgRect.bottom, height: imgRect.height } : null,
        text: textRect ? { top: textRect.top, bottom: textRect.bottom, height: textRect.height } : null,
        computedHeaderHeight: header ? window.getComputedStyle(header).height : 'unknown',
        positioning: header ? window.getComputedStyle(header).position : 'unknown'
      };
    });

    results.push(analysis);
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();

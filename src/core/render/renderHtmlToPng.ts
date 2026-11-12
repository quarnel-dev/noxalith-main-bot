import { chromium } from 'playwright'
import type { Browser } from 'playwright'

let browserPromise: Promise<Browser> | undefined

function getBrowser(): Promise<Browser> {
  browserPromise ??= chromium
    .launch({ timeout: 10_000 })
    .then((browser) => {
      browser.once('disconnected', () => {
        browserPromise = undefined
      })

      return browser
    })
    .catch((error) => {
      browserPromise = undefined
      throw error
    })

  return browserPromise
}

export async function renderHtmlToPng(html: string, selector: string): Promise<Buffer> {
  const browser = await getBrowser()
  const context = await browser.newContext({
    viewport: { width: 560, height: 320 },
    deviceScaleFactor: 2,
  })

  try {
    const page = await context.newPage()

    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 5_000,
    })

    return await page.locator(selector).screenshot({
      type: 'png',
      timeout: 5_000,
    })
  } finally {
    await context.close()
  }
}

export async function closeHtmlRenderer(): Promise<void> {
  const browser = await browserPromise
  await browser?.close()
}
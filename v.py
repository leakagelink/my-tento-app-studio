import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True); c=await b.new_context(viewport={"width":393,"height":852}); pg=await c.new_page()
    errs=[]; pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
    await pg.goto("http://localhost:8080"); await pg.evaluate("localStorage.setItem('mt-location','Indore, Madhya Pradesh')"); await pg.goto("http://localhost:8080"); await pg.wait_for_timeout(4000)
    for t in ["Skip","Get started"]:
      if await pg.get_by_text(t).count(): await pg.get_by_text(t).first.click(); await pg.wait_for_timeout(1500)
    await pg.screenshot(path="h.png")
    await pg.get_by_role("button",name="Tent").last.click(); await pg.wait_for_timeout(3000)
    await pg.mouse.wheel(0,900); await pg.wait_for_timeout(1000); await pg.screenshot(path="tent.png")
    print(errs[:5]); await b.close()
asyncio.run(main())

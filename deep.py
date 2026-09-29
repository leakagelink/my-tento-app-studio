import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True); pg=await b.new_page(viewport={"width":393,"height":852})
    errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    await pg.goto("http://localhost:8080"); await pg.wait_for_timeout(2500); await pg.get_by_text("Skip").click(); await pg.wait_for_timeout(800)
    await pg.mouse.wheel(0,700); await pg.wait_for_timeout(600); await pg.screenshot(path="home2.png")
    await pg.get_by_role("button",name="Decoration").last.click(); await pg.wait_for_timeout(1000); await pg.screenshot(path="deco.png")
    print(errs); await b.close()
asyncio.run(main())

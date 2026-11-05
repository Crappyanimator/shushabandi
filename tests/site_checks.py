"""საიტის ავტომატური შემოწმება ბრაუზერში (Playwright).

გაშვება პროექტის საქაღალდიდან:
    pip install playwright
    python -m playwright install chromium
    python tests/site_checks.py

ამოწმებს მობილურ მენიუს, სლაიდერს, მენიუს ფილტრს, ფორმის ვალიდაციას
და იმას, რომ საიტი JavaScript-ის გარეშეც იკითხება.
ეკრანის ანაბეჭდები ინახება tests/output საქაღალდეში.
"""
import os
import sys
import http.server
import threading
import functools
from playwright.sync_api import sync_playwright

site = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(site, "tests", "output")
os.makedirs(out, exist_ok=True)
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=site)
handler.log_message = lambda *a, **k: None
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{port}/index.html"

results = []
def check(name, cond):
    results.append((name, bool(cond)))

with sync_playwright() as p:
    b = p.chromium.launch()
    errors = []

    # ---- mobile: nav ----
    pg = b.new_page(viewport={"width": 375, "height": 812}, device_scale_factor=2, has_touch=True)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.goto(url)
    pg.wait_for_timeout(500)
    check("nav hidden on mobile at load", not pg.is_visible(".nav-list"))
    check("toggle visible on mobile", pg.is_visible(".menu-toggle"))
    pg.click(".menu-toggle")
    check("nav opens", pg.is_visible(".nav-list"))
    check("aria-expanded true", pg.get_attribute(".menu-toggle", "aria-expanded") == "true")
    pg.wait_for_timeout(300)
    pg.screenshot(path=f"{out}/mobile-nav-open.png")
    pg.keyboard.press("Escape")
    check("Escape closes nav", not pg.is_visible(".nav-list"))
    check("focus back on toggle", pg.evaluate("document.activeElement.classList.contains('menu-toggle')"))
    pg.click(".menu-toggle")
    pg.click(".nav-link[href='#booking']")
    pg.wait_for_timeout(900)
    check("link click closes nav", not pg.is_visible(".nav-list"))
    check("back-to-top visible after scroll", pg.evaluate("document.querySelector('.back-to-top').classList.contains('is-visible')"))
    pg.close()

    # ---- desktop: slider, filter, form ----
    pg = b.new_page(viewport={"width": 1366, "height": 800})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.goto(url)
    pg.wait_for_timeout(500)
    check("hamburger hidden on desktop", not pg.is_visible(".menu-toggle"))
    check("nav visible on desktop", pg.is_visible(".nav-list"))
    check("year filled", pg.text_content("#year").strip() == "2026")
    check("back-to-top hidden at top", not pg.evaluate("document.querySelector('.back-to-top').classList.contains('is-visible')"))

    check("slider ready + 4 dots", pg.locator(".slider-dot").count() == 4)
    pg.click(".slider-next")
    pg.wait_for_timeout(600)
    check("next -> slide 2", "-100%" in pg.get_attribute(".slider-track", "style"))
    pg.click(".slider-prev"); pg.click(".slider-prev")
    pg.wait_for_timeout(600)
    check("prev wraps to slide 4", "-300%" in pg.get_attribute(".slider-track", "style"))
    pg.click(".slider-dot >> nth=1")
    pg.wait_for_timeout(600)
    check("dot 2 active", pg.get_attribute(".slider-dot >> nth=1", "aria-current") == "true")
    pg.focus(".slider-next"); pg.keyboard.press("ArrowRight")
    pg.wait_for_timeout(600)
    check("arrow key -> slide 3", "-200%" in pg.get_attribute(".slider-track", "style"))
    pg.locator("#specials").scroll_into_view_if_needed()
    pg.mouse.move(10, 10)
    pg.screenshot(path=f"{out}/slider.png")

    check("filters visible", pg.is_visible(".menu-filters"))
    pg.click(".filter-btn[data-filter='desserts']")
    vis = pg.locator(".menu-item:visible").count()
    check("desserts filter shows 4", vis == 4)
    check("status text", pg.text_content(".menu-status") == "ნაჩვენებია 4 პოზიცია")
    check("aria-pressed", pg.get_attribute(".filter-btn[data-filter='desserts']", "aria-pressed") == "true")
    pg.locator("#menu").scroll_into_view_if_needed()
    pg.screenshot(path=f"{out}/filter.png")
    pg.click(".filter-btn[data-filter='all']")
    check("all shows 12", pg.locator(".menu-item:visible").count() == 12)

    # form: empty submit
    pg.locator("#booking").scroll_into_view_if_needed()
    pg.click(".form-submit")
    check("name error shown", pg.text_content("#name-error") != "")
    check("phone error shown", pg.text_content("#phone-error") != "")
    check("date error shown", pg.text_content("#date-error") != "")
    check("time error shown", pg.text_content("#time-error") != "")
    check("focus on first invalid", pg.evaluate("document.activeElement.id") == "name")
    pg.screenshot(path=f"{out}/form-errors.png", full_page=False)
    # bad phone
    pg.fill("#phone", "12345")
    pg.locator("#phone").blur()
    check("bad phone rejected", pg.text_content("#phone-error") != "")
    pg.fill("#phone", "+995 555-12-34-56")
    check("good phone accepted (+995, dashes)", pg.text_content("#phone-error") == "")
    # past date
    pg.fill("#date", "2020-01-01")
    pg.dispatch_event("#date", "change")
    check("past date rejected", pg.text_content("#date-error") != "")
    # valid submit
    pg.fill("#name", "<b>ნინო</b>")
    pg.fill("#date", "2026-11-12")
    pg.dispatch_event("#date", "change")
    pg.select_option("#time", "19:00")
    pg.select_option("#guests", "3")
    pg.check("#window-seat")
    pg.fill("#note", "დაბადების დღე")
    check("counter updates", pg.text_content("#note-count") == "13 / 200")
    pg.click(".form-submit")
    msg = pg.text_content("#form-success")
    check("success message", "12 ნოემბერი, 19:00, 3 სტუმარი" in msg and "ფანჯარასთან" in msg)
    check("input shown as text, not HTML", pg.locator("#form-success b").count() == 0 and "<b>" in msg)
    check("form reset", pg.input_value("#name") == "" and pg.text_content("#note-count") == "0 / 200")
    pg.screenshot(path=f"{out}/form-success.png", full_page=False)
    print("SUCCESS TEXT:", msg)
    pg.close()

    # ---- no-JS fallback ----
    ctx = b.new_context(java_script_enabled=False, viewport={"width": 375, "height": 812})
    pg = ctx.new_page()
    pg.goto(url)
    check("no-JS: nav links visible", pg.is_visible(".nav-list"))
    check("no-JS: slider scrollable", pg.evaluate("getComputedStyle(document.querySelector('.slider-viewport')).overflowX") == "auto")
    check("no-JS: menu items visible", pg.locator(".menu-item:visible").count() == 12)
    ctx.close()
    b.close()

srv.shutdown()
for name, ok in results:
    print(("PASS " if ok else "FAIL ") + name)
print("JS errors:", errors)
passed = sum(ok for _, ok in results)
print(f"{passed}/{len(results)} passed")
sys.exit(0 if passed == len(results) and not errors else 1)

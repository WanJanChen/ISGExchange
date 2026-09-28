from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


AUTOMATION_DIR = Path(__file__).resolve().parent
LOG_DIR = AUTOMATION_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)
load_dotenv(AUTOMATION_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "keep-alive.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"缺少必要設定：{name}")
    return value


def main() -> None:
    site_url = required_env("ISG_SITE_URL")
    email = required_env("ISG_LOGIN_EMAIL")
    password = required_env("ISG_LOGIN_PASSWORD")
    event_title = os.getenv("ISG_EVENT_TITLE", "").strip()
    headless = os.getenv("ISG_HEADLESS", "true").lower() not in {"false", "0", "no"}

    logging.info("開始喚醒網站：%s", site_url)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=headless)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        try:
            page.goto(site_url, wait_until="domcontentloaded", timeout=120_000)

            email_input = page.locator('input[type="email"]')
            if email_input.is_visible(timeout=120_000):
                email_input.fill(email)
                password_input = page.locator('input[type="password"]')
                password_input.fill(password)
                # The React form's submit button relies on HTML's default button
                # behavior and does not declare type="submit" explicitly.
                password_input.press("Enter")

            page.get_by_text("MY SUPPORT KIT", exact=True).wait_for(timeout=120_000)
            logging.info("登入成功，活動清單已載入")

            if event_title:
                logging.info("準備開啟指定演出：%s", event_title)
                heading = page.get_by_role("heading", name=event_title, exact=True).first
                heading.wait_for(timeout=30_000)
                heading.locator("xpath=ancestor::button[1]").click()
            else:
                logging.info("未指定演出名稱，準備開啟清單中的第一場演出")
                first_event = page.locator("article > button").first
                first_event.wait_for(timeout=30_000)
                first_event.click()

            page.get_by_text("MY CONCERT", exact=True).wait_for(timeout=60_000)
            page.get_by_text("應援製作項目／成本", exact=True).wait_for(timeout=60_000)
            logging.info("演出資料查詢成功，任務完成")
        except PlaywrightTimeoutError as error:
            screenshot = AUTOMATION_DIR / "error-screenshot.png"
            page.screenshot(path=str(screenshot), full_page=True)
            logging.exception("操作逾時；已保存畫面至 %s", screenshot)
            raise RuntimeError("網站登入或演出資料載入逾時") from error
        finally:
            browser.close()


if __name__ == "__main__":
    main()

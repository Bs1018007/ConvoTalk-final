import { Builder, By, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { expect } from "chai";

describe("Signup Test", function () {
  this.timeout(25000);
  let driver;

  before(async () => {
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(new chrome.Options())
      .build();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it("should signup successfully", async () => {
    const email = `user_${Date.now()}@mail.com`;

    await driver.get("http://localhost:5173/signup");
    await driver.findElement(By.css("input[placeholder='John Doe']")).sendKeys("Test User");
    await driver.findElement(By.css("input[placeholder='you@example.com']")).sendKeys(email);
    await driver.findElement(By.css("input[type='password']")).sendKeys("testpass123", Key.RETURN);

    await driver.wait(until.urlContains("/"), 5000);

    const url = await driver.getCurrentUrl();
    expect(url).to.contain("/");
  });
});

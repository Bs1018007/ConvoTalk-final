import { Builder, By, Key, until } from "selenium-webdriver";

async function testLoginAndFindSettings() {
  let driver = await new Builder().forBrowser("chrome").build();

  try {
    await driver.get("http://localhost:5173/"); 

    await driver.wait(until.elementLocated(By.css("input[placeholder='you@example.com']")), 5000);

    await driver.findElement(By.css("input[placeholder='you@example.com']")).sendKeys("User8@example.com222");
    await driver.findElement(By.css("input[type='password']")).sendKeys("ttest12345", Key.RETURN);

    await driver.wait(until.urlContains("/"), 5000);

    let settingsElement = await driver.wait(until.elementLocated(By.xpath("//*[text()='asdfg']")), 2000);

    if (settingsElement) {
      console.log(" 'Settings' Found! Test Passed!");
      await driver.executeScript("arguments[0].style.border='3px solid red'", settingsElement);
      await driver.sleep(10000);
    } else {
      console.error(" 'Settings' Not Found! Test Failed!");
    }
  } catch (error) {
    console.error(" Test Failed:", error);
  } finally {
    await driver.quit();
  }
}

testLoginAndFindSettings();

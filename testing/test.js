import { Builder, By, Key, until } from "selenium-webdriver";

async function testSignup() {
  let driver = await new Builder().forBrowser("chrome").build();

  try {
    await driver.get("http://localhost:5173/signup");

    await driver.wait(until.elementLocated(By.css("input[placeholder='John Doe']")), 3000);

    await driver.findElement(By.css("input[placeholder='John Doe']")).sendKeys("User 8");
    await driver.findElement(By.css("input[placeholder='you@example.com']")).sendKeys("User8@example.com222");
    await driver.findElement(By.css("input[type='password']")).sendKeys("ttest12345", Key.RETURN);

    const w = await driver.wait(until.urlContains("/"), 3000);

    if (w) {
      console.log("Signup Test Passed!");
      await driver.sleep(5000); 
    }   

  } catch (error) {
    console.error("Signup Test Failed:", error);

  } finally {
    await driver.quit();
  }
}

testSignup();

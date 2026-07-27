import { Builder, By, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { exec } from "child_process";

async function testIncomingMessage() {

  const options = new chrome.Options()
    .addArguments("--incognito")
    .addArguments("--disable-session-crashed-bubble")
    .addArguments("--disable-features=InfiniteSessionRestore")
    .addArguments("--no-first-run")
    .addArguments("--no-default-browser-check");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get("http://localhost:5173/login");

    await driver.wait(until.elementLocated(By.css("input[placeholder='you@example.com']")), 5000);
    await driver.findElement(By.css("input[placeholder='you@example.com']")).sendKeys("asdfg@gmail.com");
    await driver.findElement(By.css("input[type='password']")).sendKeys("1234567890", Key.RETURN);

    await driver.wait(until.elementLocated(By.css("aside button")), 8000);
    await driver.findElement(By.css("aside button")).click();

    await driver.wait(
      until.elementLocated(By.css("div.flex-1.overflow-y-auto.p-4.space-y-4")),
      8000
    );

    console.log("✅ Chat UI Loaded — Now testing socket message...");

    console.log("✅ Chat UI Loaded — Now testing socket message...");

    // We can run a separate script to simulate the socket event if needed.
    // For now, let's just avoid the recursive crash.
    // If we really need to trigger an external message, we should run a SEPARATE node process that is NOT this file.

    exec("node testing/TestSocketClient.js", (err, stdout, stderr) => {
      if (err) console.log("⚠️ Helper script error:", err);
      if (stdout) console.log("Helper output:", stdout);
    });

    const newMessage = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Hello from Socket Test!')]")),
      8000
    );

    console.log("🎉✅ Socket Message Received in UI — Test Passed");

  } catch (err) {
    console.error("❌ Socket UI Update Test Failed:", err);

  } finally {
    await driver.quit();
  }
}

testIncomingMessage();

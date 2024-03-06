const express = require("express");
const app = express();
const amqp = require("amqplib");
const playwright = require("playwright");

(async () => {
  const queue = "tasks";
  const conn = await amqp.connect("amqp://localhost");

  const ch1 = await conn.createChannel();
  await ch1.assertQueue(queue);

  ch1.consume(queue, async (msg) => {
    if (msg !== null) {
      const msgContent = msg.content.toString();
      console.log("getUserId:", msgContent);
      // ch1.ack(msg);

      try {
        const browser = await playwright["chromium"].launch({
          headless: true,
        });
        const context = await browser.newContext();
        const page = await context.newPage();
        page.setDefaultTimeout(5000);

        try {
          await page.goto("https://login.gupy.io/candidates/curriculum");
        } catch (e) {
          console.log("test");
          await browser.close();
          return;
        }

        try {
          await page.waitForSelector("#radix-0 > div > button");
          await page.click("#radix-0 > div > button");
        } catch (e) {
          console.log(e);
        }

        try {
          await page.waitForSelector("#password-access-button");
          await page.click(
            "#password-access-button > span > div > span:nth-child(2)"
          );

          console.log("shouldve been clicked");
        } catch (e) {
          console.log(e);
        }

        await page.waitForSelector("input[id=username]");
        await page
          .getByPlaceholder("email@email.com")
          .fill("testgupyhaha@mailinator.com");

        await page
          .getByPlaceholder("Enter your password here")
          .fill("Devtest123@");

        try {
          await page.click(
            "#candidates-root > div > div > div > div > form > button > span > div > span"
          );

          await page.click(
            "#candidates-root > div > div > div > header > div > div > button > div"
          );
        } catch (e) {
          console.log(e);
        }

        try {
          await page.click(
            "#__next > div > header > div > div > div.sc-2e8a24f-3.imizfz > div > div > button > span > div > div"
          );

          await page.click("#overlay-menu > div > div > a:nth-child(4)");
        } catch (e) {
          console.log(e);
        }

        await page.click("body > div > div > div > div > button:nth-child(2)");

        await page.route("**/*", async (route, request) => {
          const response = await request.url();
          const numbers = response.match(/\b\d{8,10}\b/g);

          if (response.includes("private-api.gupy.io") && numbers) {
            console.log(numbers[0]);
            await browser.close();
            return;
          }
          route.continue();
        });
      } catch (e) {
        console.log(e);
      }
    } else {
      console.log("Consumer cancelled by server");
    }
  });
  const ch2 = await conn.createChannel();

  app.post("/validate", (req, res) => {
    if (!req.headers.id) res.sendStatus(403);
    const id = req.headers.id;

    try {
      ch2.sendToQueue(queue, Buffer.from(`${id}`));
      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.sendStatus(404);
    }
  });

  app.listen(3000, () => {
    console.log(`Opencv app listening on port 3000`);
  });
})();

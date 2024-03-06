const express = require("express");
const app = express();
const bodyparser = require("body-parser");

function parseJwt(token) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
}

(async () => {
  app.use(bodyparser.json());
  app.post("/generatetoken", async (req, res) => {
    if (!req.body.email && !req.body.password) {
      res.sendStatus(403);
      return;
    }

    try {
      const authResponse = await fetch(
        "https://private-api.gupy.io/authentication/v2/candidate/account/signin",
        {
          body: `{"username":"${req.body.email}","password":"${req.body.password}","subdomain":"login"}`,
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
        }
      );

      const setCookie = authResponse.headers
        .getSetCookie()
        .splice(0, 1)[0]
        .split(";")[0]
        .split("=")[1];

      const userId = parseJwt(setCookie);

      res.send({ setCookie, ...userId });
    } catch (e) {
      console.log(e);
      res.sendStatus(401);
    }
  });

  app.get("/applications", async (req, res) => {
    if (!req.headers("authorization")) {
      res.sendStatus(403);
      // return
    }
  });

  app.listen(3000, () => {
    console.log(`Opencv app listening on port 3000`);
  });
})();

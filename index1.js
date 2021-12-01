const express = require("express");
const axios = require("axios");
const mime = require("mime");
const morgan = require("morgan");
const { createProxyMiddleware, responseInterceptor } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan("tiny"));
app.use(express.urlencoded());
app.use(express.json());

const regex = /\s+(href|src)=['"](.*?)['"]/g;

const getMimeType = (url) => {
  if (url.indexOf("?") !== -1) {
    // remove url query so we can have a clean extension
    url = url.split("?")[0];
  }
  return mime.getType(url) || "text/html"; // if there is no extension return as html
};
app.get(
  "/",
  createProxyMiddleware({
    target: "https://pace-ram.auth.us-east-1.amazoncognito.com",
    changeOrigin: true,
    // selfHandleResponse: true,
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      if (
        res.headers["x-frame-options"] === "deny" ||
        proxyRes.headers["X-Frame-Options"] === "deny" ||
        proxyRes.headers["x-frame-options"] === "deny" ||
        proxyRes.headers["X-Frame-Options"] === "deny"
      ) {
        res.removeHeader("X-Frame-Options");
        res.removeHeader("x-frame-options");
        // proxyRes.headers["X-Frame-Options"] = null;
        // proxyRes.headers["x-frame-Options"] = null;
        return responseBuffer.toString("utf-8");
      }
      return responseBuffer; // manipulate response and return the result
    }),
  })
);

app.post(
  "/login",
  createProxyMiddleware({
    target: "https://pace-ram.auth.us-east-1.amazoncognito.com",
    changeOrigin: true,
    selfHandleResponse: true,
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      let response = responseBuffer.toString("utf8"); // convert buffer to string
      res.removeHeader("x-frame-options");
      return response; // manipulate response and return the result
    }),
  })
);
//  (req, res) => {
// const path = req.originalUrl.split("/login")[1];
// // if (!url) {
// //   res.type("text/html");
// //   return res.end("You need to specify <code>url</code> query parameter");
// // }

// axios
//   .post("https://pace-ram.auth.us-east-1.amazoncognito.com/login" + path, req.body, { headers: { ...req.cookies, "sec-fetch-dest": "document" }, responseType: "arraybuffer" }) // set response type array buffer to access raw data
//   .then(({ data }) => {
//     const urlMime = getMimeType(url); // get mime type of the requested url
//     res.type(urlMime);
//     res.send(data);
//   })
//   .catch((error) => {
//     console.log(error);
//   });
// });

app.listen(port, () => console.log(`Listening on port ${port}!`));

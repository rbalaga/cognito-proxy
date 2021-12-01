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

app.use(
  "/",
  createProxyMiddleware({
    target: "https://pace-ram.auth.us-east-1.amazoncognito.com",
    changeOrigin: true,
    selfHandleResponse: true,
    headers: {
      referer: "https://pace-ram.auth.us-east-1.amazoncognito.com",
      origin: "https://pace-ram.auth.us-east-1.amazoncognito.com",
    },
    router: {
      // when request.headers.host == 'dev.localhost:3000',
      // override target 'http://www.example.org' to 'http://localhost:8000'
      "localhost:5000": "https://pace-ram.auth.us-east-1.amazoncognito.com",
    },
    onProxyReq: function (proxyReq, req, res) {
      proxyReq.setHeader("x-added", "foobar");
      proxyReq.setHeader("origin", "https://pace-ram.auth.us-east-1.amazoncognito.com");
      proxyReq.setHeader(
        "referer",
        "https://pace-ram.auth.us-east-1.amazoncognito.com/login?response_type=code&client_id=38edcafhij8i8irkia4hblognl&redirect_uri=https://search-connect-ctr-agent-records-orcax4mgypqgo7ho2yze6eqwtm.us-east-1.es.amazonaws.com/_dashboards/app/home&state=adfacd76-1e8a-47b7-b155-b988de2eb9e2"
      );
      proxyReq.setHeader("sec-fetch-dest", "document");
      proxyReq.setHeader("sec-fetch-site", "same-origin");
    },
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      // detect json responses
      if (proxyRes.headers["content-type"].includes("text/html")) {
        console.log("html response received");
        let data = responseBuffer.toString("utf8");

        res.removeHeader("X-Frame-Options");
        return data;
      } else {
        return responseBuffer; // manipulate response and return the result
      }
    }),
  })
);

app.listen(port, () => console.log(`Listening on port ${port}!`));

"use strict";
const serverless = require("serverless-http");
const express = require("express");
const { createProxyMiddleware, responseInterceptor } = require("http-proxy-middleware");

const app = express();

const cognitoLoginProxy = createProxyMiddleware({
  target: "https://pace-ram.auth.us-east-1.amazoncognito.com",
  changeOrigin: true,
  pathRewrite: {
    "^/opensearch/login": "/login", // remove base path
  },
  selfHandleResponse: true,
  onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
    res.removeHeader("X-Frame-Options");
    res.removeHeader("x-frame-options");
    console.log("location header verification");
    if (res.hasHeader("location")) {
      const location = res.getHeader("location") || "";
      res.removeHeader("location");
      if (location.includes("https://search-connect-ctr-agent-records-orcax4mgypqgo7ho2yze6eqwtm.us-east-1.es.amazonaws.com/_dashboards")) {
        res.setHeader(
          "location",
          location.replace(
            "https://search-connect-ctr-agent-records-orcax4mgypqgo7ho2yze6eqwtm.us-east-1.es.amazonaws.com/_dashboards",
            "https://zr2jvu6nyj.execute-api.us-east-1.amazonaws.com/opensearch/_dashboards"
          )
        );
      } else if (location.includes("https://pace-ram.auth.us-east-1.amazoncognito.com/error")) {
        res.setHeader("location", location.replace("https://pace-ram.auth.us-east-1.amazoncognito.com/error", "https://zr2jvu6nyj.execute-api.us-east-1.amazonaws.com/error"));
      }
    }
    return responseBuffer; // manipulate response and return the result
  }),
});

const openSearchDashboardProxy = createProxyMiddleware({
  target: "https://search-connect-ctr-agent-records-orcax4mgypqgo7ho2yze6eqwtm.us-east-1.es.amazonaws.com/",
  changeOrigin: true,
  selfHandleResponse: true,
  pathRewrite: {
    "^/opensearch/_dashboards/app/dashboards": "/_dashboards/app/dashboards", // remove base path
    "^/opensearch/_dashboards/app/home": "/_dashboards/app/home", // remove base path
  },
  onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
    res.removeHeader("X-Frame-Options");
    res.removeHeader("x-frame-options");
    console.log("location header verification");
    if (res.hasHeader("location")) {
      const location = res.getHeader("location");
      res.removeHeader("location");
      res.setHeader("location", location.replace("https://pace-ram.auth.us-east-1.amazoncognito.com/login", "https://zr2jvu6nyj.execute-api.us-east-1.amazonaws.com/opensearch/login"));
    }
    return responseBuffer;
  }),
});

app.use("/login", cognitoLoginProxy);
app.use("/error", cognitoLoginProxy);
app.use("/_dashboards/app/dashboards", openSearchDashboardProxy);
app.use("/_dashboards/app/home", openSearchDashboardProxy);

app.use("/", cognitoLoginProxy);

const handler = serverless(app);
module.exports.handler = async (event, context) => {
  try {
    const result = await handler(event, context);
    console.log("RAM: received proxy request");
    console.log(result);
    return result;
  } catch (error) {
    return error;
  }
};

const express = require("express");
const { createProxyMiddleware, responseInterceptor } = require("http-proxy-middleware");
const cors = require("cors");
const app = express();
app.use(cors());

app.use(
		"/login",
		createProxyMiddleware({
			target: "https://pace-ram.auth.us-east-1.amazoncognito.com",
			changeOrigin: true,
			selfHandleResponse: true,
			onProxyReq: (proxyReq, req, res) => {
				console.log("req headers", req.headers);
				console.log("proxy req headers", proxyReq.headers);
			},
			onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
				// detect json responses
				res.removeHeader("X-Frame-Options");
				console.log("location header verification");
        let cookiesArr = res.getHeader("set-cookie");
        if (cookiesArr) {
          cookiesArr = cookiesArr.map((cookie) => {
            if (cookie.includes('SameSite')) {
               cookie = cookie.replace('=Lax', '=None'); 
            } else {
              cookie += '; SameSite=None';
            }
            cookie = cookie.replace('Secure', 'Secure=false');
            return cookie;
          });
          res.setHeader("set-cookie", cookiesArr);
        }
				console.log(res.getHeaderNames());
				if (res.hasHeader("location")) {
					const location = res.getHeader("location");
					res.removeHeader("location");
					res.setHeader(
						"location",
						location.replace(
							"https://search-connect-ctr-agent-records-orcax4mgypqgo7ho2yze6eqwtm.us-east-1.es.amazonaws.com/_dashboards",
							"_dashboards",
						),
					);
				}
				// if (proxyRes.headers["content-type"]?.includes("text/html")) {
				// 	console.log("html response received proxy");
				// 	let data = responseBuffer.toString("utf8");
				// 	return data;
				// } else {
				// }
				return responseBuffer; // manipulate response and return the result
			}),
		}),
	);

	// app.post("/login", (req, res) => res.end(req.body));

	app.use(
		"/_dashboards",
		createProxyMiddleware({
			target: "https://search-connect-ctr-agent-records-orcax4mgypqgo7ho2yze6eqwtm.us-east-1.es.amazonaws.com/",
			changeOrigin: true,
			selfHandleResponse: true,
			onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
				// detect json responses
				res.removeHeader("X-Frame-Options");
				console.log("location header verification");
        let cookiesArr = res.getHeader("set-cookie");
        if (cookiesArr) {
          cookiesArr = cookiesArr.map((cookie) => {
            if (cookie.includes('SameSite')) {
               cookie = cookie.replace('=Lax', '=None'); 
            } else {
              cookie += '; SameSite=None';
            }
            cookie = cookie.replace('Secure', 'Secure=false');
            return cookie;
          });
          res.setHeader("set-cookie", cookiesArr);
        }
				if (res.hasHeader("location")) {
					const location = res.getHeader("location");
					res.removeHeader("location");
					// console.log("location", location);
					res.setHeader(
						"location",
						location.replace("https://pace-ram.auth.us-east-1.amazoncognito.com/login", "/login"),
					);
				}
				// if (proxyRes.headers["content-type"]?.includes("text/html")) {
				// 	console.log("html response received proxy");
				// 	let data = responseBuffer.toString("utf8");
				// 	return data;
				// } else {
				// }
				return responseBuffer; // manipulate response and return the result
			}),
		}),
	);

const cognitoLoginProxy = createProxyMiddleware({
  target: "https://pace-ram.auth.us-east-1.amazoncognito.com",
  changeOrigin: true,
  // onProxyReq: function (proxyReq, req, res) {
  //proxyReq.setHeader('Cookie', 'XSRF-TOKEN=b6ef01c6-9de0-4ae6-a36b-4370a7a4bc46');
  // },
  // onProxyReq: function (proxyReq, req, res) {
  // //  proxyReq.removeHeader('origin');
  // // req.removeHeader('origin');
  //   //req.headers['origin'] = 'https://pace-ram.auth.us-east-1.amazoncognito.com';
  //   //req.headers['host'] = 'https://pace-ram.auth.us-east-1.amazoncognito.com';
  //   //req.headers['referer'] = req.headers['referer'].replace('https://zr2jvu6nyj.execute-api.us-east-1.amazonaws.com', 'https://pace-ram.auth.us-east-1.amazoncognito.com');
  // // proxyReq.setHeader('origin', 'https://pace-ram.auth.us-east-1.amazoncognito.com');
  //   //proxyReq.setHeader('host', 'https://pace-ram.auth.us-east-1.amazoncognito.com');

  //   //proxyReq.setHeader('referer', 'https://zr2jvu6nyj.execute-api.us-east-1.amazonaws.com', 'https://pace-ram.auth.us-east-1.amazoncognito.com');

  //   //proxyReq.setHeader('content-type', 'application/x-www-form-urlencoded');
  //   //proxyReq.setHeader('host', 'https://pace-ram.auth.us-east-1.amazoncognito.com');
  //   console.log('RAM: proxyreq headers', req.headers);
  //   console.log('RAM: req headers', req.headers);
  // },
  selfHandleResponse: true,
  onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
    res.removeHeader("X-Frame-Options");
    res.removeHeader("x-frame-options");
    let cookiesArr = res.getHeader("set-cookie");
    if (cookiesArr) {
      cookiesArr = cookiesArr.map((cookie) => `${cookie.split(";")[0]}; SameSite=None; Secure`);
      res.setHeader("set-cookie", cookiesArr);
    }
    console.log("location header verification");
    if (res.hasHeader("location")) {
      const location = res.getHeader("location") || "";
      res.removeHeader("location");
      res.setHeader(
        "location",
        location.replace("https://search-connect-ctr-agent-records-orcax4mgypqgo7ho2yze6eqwtm.us-east-1.es.amazonaws.com/_dashboards", "https://cognitologin.herokuapp.com/_dashboards")
      );
    }
    return responseBuffer; // manipulate response and return the result
  }),
});

const openSearchDashboardProxy = createProxyMiddleware({
  target: "https://search-connect-ctr-agent-records-orcax4mgypqgo7ho2yze6eqwtm.us-east-1.es.amazonaws.com/",
  changeOrigin: true,
  selfHandleResponse: true,
  // pathRewrite: {
  //   "^/opensearch/_dashboards/app/dashboards": "/_dashboards/app/dashboards", // remove base path
  //   "^/opensearch/_dashboards/app/home": "/_dashboards/app/home", // remove base path
  // },
  onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
    res.removeHeader("X-Frame-Options");
    res.removeHeader("x-frame-options");
    console.log("location header verification");
    if (res.hasHeader("location")) {
      const location = res.getHeader("location");
      res.removeHeader("location");
      res.setHeader("location", location.replace("https://pace-ram.auth.us-east-1.amazoncognito.com/login", "https://cognitologin.herokuapp.com/login"));
    }
    return responseBuffer;
  }),
});

// app.use("/login", cognitoLoginProxy);
// app.use("/logout", cognitoLoginProxy);
// app.use("/_dashboards/*", openSearchDashboardProxy);
app.use("/ram", (req, res) => {
  res.end("Hello RAM from cognito proxy");
});
app.use("/", (req, res) => {
  res.end("Hello from cognito proxy v2");
});
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`server is running at ${port} port.`);
});

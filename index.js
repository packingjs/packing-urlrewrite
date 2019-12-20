var fs = require('fs');
var path = require('path');
var httpProxy = require('http-proxy');

var proxy = httpProxy.createProxyServer();
proxy.on('error', (err, req, res) => {
  console.log(`request ${req.url} failed.`);
  res.status(500).end();
});

module.exports = (app, options = {}) => {
  Object.assign(options, {
    mockRoot: '.',
    useFileMock: process.env.NODE_ENV === 'local'
  });

  if (process.env.DACE_PROXY) {
    const requireToken = 'require!';

    let rules = {};
    try {
      rules = JSON.parse(process.env.DACE_PROXY);
      console.log('rules:', rules);
    } catch (e) {
      throw new Error(`[JSON.parse error] DACE_PROXY is an invalid json. ${e}`);
    }

    if (Object.keys(rules).length > 0) {
      Object.keys(rules).forEach((route) => {
        // console.log('route:', route);
        app.use(route, (req, res, next) => {
          console.log('req.baseUrl:', req.baseUrl);
          // 出于性能的考虑，只有本地开发时才有 mock 数据的功能
          if (rules[route].startsWith(requireToken) && options.useFileMock) {
            let filename = rules[route]
              .replace(requireToken, '')
              .replace('$0', req.params[0]);
            if (filename.startsWith('/')) {
              filename = filename.substring(1, filename.length);
            }
            console.log('filename:', filename);
            const mockJs = path.resolve(options.mockRoot, filename);
            console.log('mockJs:', mockJs);
            console.log(fs.existsSync(mockJs));
            if (fs.existsSync(mockJs)) {
              require(mockJs)(req, res);
            } else {
              next();
            }
          } else {
            proxy.web(req, res, {
              target: rules[route]
            });
          }
        });
      });
    }
  }
};

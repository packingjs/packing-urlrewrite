'use strict';

var url = require('url');
var path = require('path');
var fs = require('fs');
var stripJsonComments = require('strip-json-comments');
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});

function requireUncached(module){
  delete require.cache[require.resolve(module)];
  return require(module);
}

function dispatcher(req, res, next) {
  return function (rule) {
    if (rule.from.test(req.path)) {
      if (rule.to.indexOf('require!') === 0) {
        // 使用本地文件模拟数据
        var urlObject = url.parse(req.url);
        var filepath = urlObject.pathname
          .replace(rule.from, rule.to)
          .replace('require!', '');
        var realpath = path.join(process.cwd(), filepath);
        res.setHeader('Content-Type', 'application/json');
        requireUncached(realpath)(req, res);
      } else if (/^(https{0,1}:){0,1}\/\//.test(rule.to)) {
        // 使用跨域API模拟数据
        var toUrl = req.url.replace(rule.from, rule.to);
        var targetUrl = url.parse(toUrl);
        req.url = toUrl;
        proxy.web(req, res, {
          target: targetUrl.protocol + '//' + targetUrl.host,
          changeOrigin: true
        }, function (e) {
           // 连接服务器错误
          res.writeHead(502, { 'Content-Type': 'text/html' });
          res.end(e.toString());
        });
      } else {
        // 使用同域名的其他API模拟数据
        var toUrl = req.url.replace(req.path, rule.to);
        req.url = toUrl;
        next();
      }
      return true;
    }
  };
};

function convertRules(data) {
  return Object.keys(data).map(function(from) {
    return {
      from: new RegExp(from),
      to: data[from]
    };
  });
}

function loadRules(path) {
  var data = fs.readFileSync(path, 'utf-8')
  data = JSON.parse(stripJsonComments(data));
  return convertRules(data);
}

function rewrite(rewriteTable) {
  var rules = [];
  var rulesHotFile = rewriteTable.rulesHotFile;
  if (rulesHotFile) {
    rules = loadRules(rulesHotFile);
    fs.watchFile(rulesHotFile, function (curr, prev) {
      console.log('rewriteRules changed.');
      clearTimeout(st);
      var st = setTimeout(function() {
        if (curr.mtime > prev.mtime) {
          console.log('reload rewriteRules...');
          rules = loadRules(rulesHotFile);
          console.log('reload rewriteRules success.');
        }
      }, 500);
    })
  } else {
    rules = convertRules(rewriteTable);
  }
  return function(req, res, next) {
    if (rules.length === 0 || !rules.some(dispatcher(req, res, next))) {
      next();
    }
  };
}

module.exports = rewrite;

'use strict';

var url = require('url');
var path = require('path');

function requireUncached(module){
  delete require.cache[require.resolve(module)];
  return require(module);
}

function dispatcher(req, res, next) {
  return function (rule) {
    // console.log('req.url: ', req.url);
    if (rule.from.test(req.url)) {
      if (rule.to.indexOf('require!') === 0) {
        var urlObject = url.parse(req.url);
        var filepath = urlObject.pathname
          .replace(rule.from, rule.to)
          .replace('require!', '');
        var realpath = path.join(process.cwd(), filepath);
        res.setHeader('Content-Type', 'application/json');
        requireUncached(realpath)(req, res);
      }
    }
    return true;
  };
};

function rewrite(rewriteTable) {
  var rules = [];
  Object.keys(rewriteTable).forEach(function(from) {
    var to = rewriteTable[from];
    rules.push({
      from: new RegExp(from),
      to: to
    });
  });
  return function(req, res, next) {
    // console.log(rules);
    if (!rules.length || !rules.some(dispatcher(req, res, next))) {
      next();
    }
  };
}

module.exports = rewrite;

# packing-urlrewrite

>一个用来做代理和转发URL的express中间件

[![NPM](https://nodei.co/npm/packing-urlrewrite.png)](https://nodei.co/npm/packing-urlrewrite/)

## 安装
```
npm install packing-urlrewrite --save-dev
```

## 使用

### 使用静态配置(静态和热发配置二选一)

```javascript
import Express from 'express';
import urlrewrite from 'packing-urlrewrite';

const rules = {
  // 1.用json模拟数据，标示符为 `require!`
  '^/api/(.*)': 'require!/mock/api/$1.js',
  // 2.同域转发
  '^/$': '/index.html',
  // 3.跨域转发
  '^/test/(.*)': 'http://test.xxx.com/test/$1',
};
const app = new Express();
app.use(urlrewrite(rules));
```


```javascript
// /mock/api/$1.js
export default (req, res) => {
  // maybe get parameters from request
  const data = {
    name: 'Joe'
  };
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};
```

### 使用热发配置

```javascript
import Express from 'express';
import urlrewrite from 'packing-urlrewrite';

const rules = {
  // 用热发配置rulesHotFile
  rulesHotFile: __dirname + '/rewriteRules.cfg'
};
const app = new Express();
app.use(urlrewrite(rules));
```

```javascript
// rewriteRules.cfg 文件内容必须符合JSON格式，但可以加注释
{
  // 1.用json模拟数据，标示符为 `require!`
  "^/api/(.*)": "require!/mock/api/$1.js",
  // 2.同域转发
  "^/$": "/index.html",
  // 3.跨域转发
  "^/test/(.*)": "http://test.xxx.com/test/$1",
}
```



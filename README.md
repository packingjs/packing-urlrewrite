# packing-urlrewrite

>一个用来做代理和转发URL的 express 中间件

[![NPM](https://nodei.co/npm/packing-urlrewrite.png)](https://nodei.co/npm/packing-urlrewrite/)

## 安装
```
npm install packing-urlrewrite --save-dev
```

## 使用

```javascript
import Express from 'express';
import urlrewrite from 'packing-urlrewrite';

const rules = {
  // 1.用json模拟数据，标示符为 `require!`
  '^/api/*': 'require!/mock/api/$0.js',
  // 2.转发
  '^/test/*': 'http://test.xxx.com/test/$0'
};
const app = new Express();
app.use(urlrewrite(rules));
```

```javascript
// /mock/api/$0.js
export default (req, res) => {
  // maybe get parameters from request
  const data = {
    name: 'Joe'
  };
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};
```

## 参数
`rules` - {object} 转发规则
`options` - {object} 可选参数
`options.mockRoot` - {string} 存放模拟数据的目录在工程中的位置，默认值：`mock`
`options.useFileMock` - {boolean} 是否启用本地文件模拟数据功能

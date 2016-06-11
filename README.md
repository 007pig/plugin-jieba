# Gitbook 的中文搜索引擎

本插件是 Gitbook 自带的 [search](https://github.com/GitbookIO/plugin-search) 搜索插件的中文搜索后端引擎。 

插件的原理是在 Gitbook build 时通过 nodejieba 将文章进行中文分词，并储存在 pouchdb 数据库中。在 Gitbook
加载时会将 pouchdb 的数据载入到浏览器的 IndexedDB 中，以便快速搜索。

本插件是在 [lunr](https://github.com/GitbookIO/plugin-lunr) 的基础上修改而来。

### 使用方法

在 `book.json` 中配置：

```js
{
    "plugins": [
        "-lunr",
        "search-jieba"
    ]
}
```

### 禁止某个页面索引

如果您不想让某个页面被搜索到，可以在该页面添加 YAML 头：

```md
---
search: false
---

# 不索引页面

此页面不会被 jieba 索引。
```


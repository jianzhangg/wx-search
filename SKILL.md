# Skill: wx-search（fork）

微信公众号文章搜索与正文抓取。搜索输出 JSON 到 stdout，正文输出纯文本，失败时退出码非 0。

## 调用方式

```bash
wx-search search "关键词"
```

## 命令一览

| 命令 | 用途 |
|---|---|
| `search <query> [--page <n>] [--user-agent <ua>]` | 单页结果（约 10 条），JSON 输出。`--page` 默认 1 |
| `search-all <query> [--max-pages <n>] [--user-agent <ua>]` | 自动翻页（页间隔 1s），遇空页或达上限停止，`--max-pages` 默认 10 |
| `content <real_url> [--referer <url>] [--user-agent <ua>]` | 输出文章正文纯文本 |

环境变量 `WX_SEARCH_UA` 与 `--user-agent` 等效（flag 优先）。搜狗挑战内置 UA 时换一个即可。

## 标准工作流

**1. 先搜索**

```bash
wx-search search "人工智能"
```

输出为 JSON 数组，每项字段：

| 字段 | 说明 |
|---|---|
| `title` | 文章标题 |
| `link` | 搜狗跳转链接，抓正文时作为 `--referer` 传入 |
| `real_url` | 解析后的真实 `mp.weixin.qq.com` 地址 |
| `publish_time` | ISO 8601 发布时间 |
| `page` | 结果页码（字符串） |

**2. 再抓正文**（把上一步的 `real_url` 作为参数、`link` 作为 `--referer`）

```bash
wx-search content "<real_url>" --referer "<link>"
```

## 使用建议

- 中文关键词的返回质量普遍好于英文。
- 只需要几条结果时用 `search`；确实需要大量结果再用 `search-all`。
- 抓正文时带上 `--referer`（传搜索结果的 `link`），成功率更高。
- 遇到反爬报错先换 UA 重试，别猛刷。

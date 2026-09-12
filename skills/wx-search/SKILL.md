---
name: wx-search
description: 用搜狗微信搜索从命令行搜公众号文章并抓正文。当用户想找、搜、读、总结或分析公众号文章、微信内容时用这个 skill，比如“搜一下公众号关于 X 的文章”、读 mp.weixin.qq.com 链接、查某个话题的中文公众号覆盖。
---

# wx-search：搜公众号文章、读正文

`wx-search` 经搜狗微信搜索搜公众号（微信公众号）文章并提取正文。搜索输出 JSON，正文输出纯文本；失败时退出码非 0，原因打到 stderr。

统一用 `npx wx-search` 跑，不用安装：

```bash
npx wx-search search "人工智能"
```

## 典型流程

1. **先搜**文章：

   ```bash
   npx wx-search search "人工智能"
   ```

   输出 JSON 数组，每项字段：
   - `title` — 文章标题
   - `link` — 搜狗跳转链接（抓正文时经 `--referer` 传入）
   - `real_url` — 真实 `mp.weixin.qq.com` 地址（空字符串表示解析失败，多为限流）
   - `publish_time` — ISO 8601 发布时间
   - `page` — 结果页码（字符串）

2. **再读**正文（`real_url` 作参数，`link` 作 `--referer`）：

   ```bash
   npx wx-search content "<real_url>" --referer "<link>"
   ```

## 命令

| 命令 | 用途 |
| --- | --- |
| `search <query> [--page <n>] [--user-agent <ua>]` | 单页约 10 条 JSON，`--page` 默认 1 |
| `search-all <query> [--max-pages <n>] [--user-agent <ua>]` | 自动翻页（页间隔 1s），遇空页或达上限停止，`--max-pages` 默认 10 |
| `content <real_url> [--referer <url>] [--user-agent <ua>]` | 输出正文纯文本 |

## 自定义 UA

所有联网命令都支持 `--user-agent <ua>`，环境变量 `WX_SEARCH_UA` 等效（flag 优先）。搜狗反爬挑战内置 UA 时，换个纯 Chrome UA 重试，别猛刷。

## 注意事项

- **控制请求量。**刷太猛会触发搜狗验证码：表现为 `real_url` 为空或 search 直接报反爬错；退避过会儿再试，别硬刷。
- 只要几条结果就用 `search`，别用 `search-all`。
- 抓正文尽量带 `--referer`（传 `link` 字段），成功率明显更高。
- 中文关键词效果普遍好于英文。
- 退出码非 0 即失败，看 stderr，别解析 stdout。

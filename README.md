# wx-search

搜狗微信搜索 CLI：搜公众号文章、解析原文链接、抓正文。结果打到 stdout（search 系 JSON、正文纯文本），方便 shell 管道和 AI agent 调用。

Fork 自 [tjx666/wx-search-cli](https://github.com/tjx666/wx-search-cli)（MIT），核心抓取逻辑保持一致，另见致谢。

## 与上游的差异

- **User-Agent 可配**：`--user-agent` 参数 / `WX_SEARCH_UA` 环境变量，优先级 flag > env > 内置默认。
- **默认 UA 换成纯 Chrome**：上游硬编码 `…Chrome/137… Edg/137.0.0.0` 会被搜狗直接送反爬挑战；换成不带 `Edg/` 的 Chrome UA 后同 IP 背靠背验证放行（2026-09-12，Chrome 137 与 154 均验证通过）。
- `content` 的 `sec-ch-ua` 按所用 UA 的 Chrome 大版本自动生成；传非 Chrome UA 时自动省略该头，保持头集合自洽。

## 安装

```bash
npm i -g wx-search
# 或本地跑
npm install && npm run build && node dist/index.js search "关键词"
```

## 作为 Agent Skill 安装

仓库根的 `SKILL.md` 带标准 frontmatter（name + description），直接兼容 [skills.sh](https://skills.sh) 生态，拉下来就能装：

```bash
# 进自己的 agent 装一个（支持 opencode / claude-code / codex / cursor 等 70+）
npx skills add jianzhangg/wx-search
# 只看不装：先列出发现的 skill
npx skills add jianzhangg/wx-search --list
# 装给指定 agent、全局生效、免确认
npx skills add jianzhangg/wx-search -a opencode -g -y
```

装完不用记命令也可以自助上手：`wx-search skill` 直接打印同一份 skill 文档。

## 用法

```bash
# 单页搜索（JSON）
wx-search search "人工智能"
wx-search search "人工智能" --page 2

# 自动翻页（页间隔 1s，遇空页或达上限停止）
wx-search search-all "人工智能" --max-pages 3

# 抓正文（real_url 必填，link 建议经 --referer 传入）
wx-search content "<real_url>" --referer "<link>"

# UA 被挑战时临时换一个，不用升级
wx-search search "人工智能" --user-agent "Mozilla/5.0 ..."
WX_SEARCH_UA="Mozilla/5.0 ..." wx-search search "人工智能"
```

`search` 单条结果字段：`title` / `link`（搜狗跳转链接）/ `real_url`（真实 `mp.weixin.qq.com` 地址）/ `publish_time`（ISO 8601）/ `page`。

失败时退出码非 0，错误信息打到 stderr。

## 开发

```bash
npm install
npm test        # tsc 构建 + node --test 离线单测（无网络请求）
node dist/index.js search "关键词"   # 实网冒烟（省着点用，搜狗有反爬）
```

## 致谢

- 上游 [tjx666/wx-search-cli](https://github.com/tjx666/wx-search-cli) 及其致谢的原始 Python 项目 [fancyboi999/weixin_search_mcp](https://github.com/fancyboi999/weixin_search_mcp)。
- 抓取依赖搜狗微信搜索端点，对方改版或限流时可能失效；重度使用会触发验证码。

## License

MIT

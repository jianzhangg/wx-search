import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
    DEFAULT_USER_AGENT,
    USER_AGENT_ENV_VAR,
    chromeMajorFromUA,
    resolveUserAgent,
    secChUaForUA,
} from '../dist/constants.js';
import {
    extractArticleText,
    extractRealUrlFromLinkPage,
    formatPublishTime,
    isAntispiderResponse,
    parseSearchPage,
} from '../dist/parsers.js';

describe('isAntispiderResponse', () => {
    it('flags antispider redirect URLs', () => {
        assert.equal(
            isAntispiderResponse('https://weixin.sogou.com/antispider/?from=%2Fweixin', '<html></html>'),
            true,
        );
    });
    it('flags captcha widget pages', () => {
        assert.equal(isAntispiderResponse('https://weixin.sogou.com/weixin', '<div id="seccodeRight"></div>'), true);
        assert.equal(isAntispiderResponse('https://weixin.sogou.com/weixin', '<link href="anti.min.css">'), true);
    });
    it('passes normal pages', () => {
        assert.equal(isAntispiderResponse('https://weixin.sogou.com/weixin?type=2', '<html><body>ok</body></html>'), false);
    });
});

describe('formatPublishTime', () => {
    it('converts timeConvert() to ISO 8601', () => {
        assert.equal(formatPublishTime("document.write(timeConvert('1783164489'))"), '2026-07-04T11:28:09.000Z');
    });
    it('falls back to raw text', () => {
        assert.equal(formatPublishTime('昨天'), '昨天');
    });
});

describe('parseSearchPage', () => {
    const html = `
        <ul>
          <li id="sogou_vr_11002601_box_0"><div class="txt-box">
            <h3><a id="sogou_vr_11002601_title_0" href="/link?url=abc">标题一</a></h3>
            <div class="s-p"><span class="s2"><script>document.write(timeConvert('1783164489'))</script></span></div>
          </div></li>
          <li id="sogou_vr_11002601_box_1"><div class="txt-box">
            <h3><a id="sogou_vr_11002601_title_1" href="https://weixin.sogou.com/link?url=def">标题二</a></h3>
            <div class="s-p"><span class="s2">3天前</span></div>
          </div></li>
        </ul>`;
    it('extracts title/link/time triples and absolutizes links', () => {
        const items = parseSearchPage(html, 'https://weixin.sogou.com');
        assert.equal(items.length, 2);
        assert.equal(items[0].title, '标题一');
        assert.equal(items[0].link, 'https://weixin.sogou.com/link?url=abc');
        assert.equal(items[0].publishTime, '2026-07-04T11:28:09.000Z');
        assert.equal(items[1].link, 'https://weixin.sogou.com/link?url=def');
        assert.equal(items[1].publishTime, '3天前');
    });
});

describe('extractRealUrlFromLinkPage', () => {
    it('joins url += fragments and strips @ noise', () => {
        const body = `<script>var url='';url += 'https://mp.weixin.@qq.com/s?src=11&t';url += 'imestamp=123';</script>`;
        assert.equal(extractRealUrlFromLinkPage(body), 'https://mp.weixin.qq.com/s?src=11&timestamp=123');
    });
    it('prepends https://mp. when scheme is missing', () => {
        const body = `<script>url += 'weixin.qq.com/s?src=11';</script>`;
        assert.equal(extractRealUrlFromLinkPage(body), 'https://mp.weixin.qq.com/s?src=11');
    });
    it('returns empty string when no fragments', () => {
        assert.equal(extractRealUrlFromLinkPage('<html>nope</html>'), '');
    });
});

describe('extractArticleText', () => {
    it('collects #js_content text nodes in order', () => {
        const html = `<div id="js_content"><p>第一段</p><p>  <span>第二段</span> </p><p></p></div>`;
        assert.equal(extractArticleText(html), '第一段\n第二段');
    });
    it('returns null when #js_content is missing', () => {
        assert.equal(extractArticleText('<div>deleted</div>'), null);
    });
});

describe('resolveUserAgent', () => {
    const saved = process.env[USER_AGENT_ENV_VAR];
    it('flag wins over env and default', () => {
        process.env[USER_AGENT_ENV_VAR] = 'env-ua';
        try {
            assert.equal(resolveUserAgent('flag-ua'), 'flag-ua');
        } finally {
            if (saved === undefined) delete process.env[USER_AGENT_ENV_VAR];
            else process.env[USER_AGENT_ENV_VAR] = saved;
        }
    });
    it('env wins over default', () => {
        process.env[USER_AGENT_ENV_VAR] = 'env-ua';
        try {
            assert.equal(resolveUserAgent(), 'env-ua');
            assert.equal(resolveUserAgent('  '), 'env-ua');
        } finally {
            if (saved === undefined) delete process.env[USER_AGENT_ENV_VAR];
            else process.env[USER_AGENT_ENV_VAR] = saved;
        }
    });
    it('falls back to default', () => {
        delete process.env[USER_AGENT_ENV_VAR];
        try {
            assert.equal(resolveUserAgent(), DEFAULT_USER_AGENT);
        } finally {
            if (saved !== undefined) process.env[USER_AGENT_ENV_VAR] = saved;
        }
    });
});

describe('sec-ch-ua helpers', () => {
    it('extracts chrome major and builds client hints', () => {
        assert.equal(chromeMajorFromUA(DEFAULT_USER_AGENT), '154');
        assert.equal(secChUaForUA(DEFAULT_USER_AGENT), '"Chromium";v="154", "Google Chrome";v="154", "Not/A)Brand";v="24"');
    });
    it('returns undefined for non-chrome UAs', () => {
        const ff = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0';
        assert.equal(chromeMajorFromUA(ff), undefined);
        assert.equal(secChUaForUA(ff), undefined);
    });
});

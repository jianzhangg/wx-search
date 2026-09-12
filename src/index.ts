#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { USER_AGENT_ENV_VAR } from './constants.js';
import { getArticleContent } from './content.js';
import { sogouWeixinSearch, sogouWeixinSearchAll } from './search.js';

export const CLI_NAME = 'wx-search';
export const CLI_VERSION = '0.2.0';

const HELP = `${CLI_NAME} v${CLI_VERSION}
Search and read WeChat official account (公众号) articles via Sogou WeChat search.

Usage:
  ${CLI_NAME} search <query> [--page <n>] [--user-agent <ua>]            Search articles, one page (JSON to stdout)
  ${CLI_NAME} search-all <query> [--max-pages <n>] [--user-agent <ua>]   Search with auto pagination (JSON to stdout)
  ${CLI_NAME} content <real_url> [--referer <url>] [--user-agent <ua>]   Fetch article body text (plain text to stdout)
  ${CLI_NAME} skill                                                Print the agent skill document (SKILL.md)

Options:
  --page <n>         Page number for search (default: 1)
  --max-pages <n>    Max pages for search-all (default: 10)
  --referer <url>    Referer header for content, typically the "link" field from search results
  --user-agent <ua>  User-Agent header (default: built-in Chrome UA, or $${USER_AGENT_ENV_VAR} when set)
  -h, --help         Show this help
  -v, --version      Show version

Environment:
  ${USER_AGENT_ENV_VAR}  Same effect as --user-agent (flag wins). Useful when Sogou
    starts challenging the built-in UA — swap it without upgrading.

Examples:
  ${CLI_NAME} search "人工智能"
  ${CLI_NAME} search "人工智能" --page 2
  ${CLI_NAME} search-all "人工智能" --max-pages 3
  ${CLI_NAME} content "https://mp.weixin.qq.com/s?src=11&..." --referer "https://weixin.sogou.com/link?..."
  ${CLI_NAME} search "人工智能" --user-agent "Mozilla/5.0 ..."
`;

function fail(message: string): never {
    console.error(`Error: ${message}`);
    console.error(`Run "${CLI_NAME} --help" for usage.`);
    process.exit(1);
}

function parsePositiveInt(raw: string, flag: string): number {
    const value = Number.parseInt(raw, 10);
    if (Number.isNaN(value) || value < 1) {
        fail(`${flag} expects a positive integer, got "${raw}"`);
    }
    return value;
}

async function main(): Promise<void> {
    const { values, positionals } = parseArgs({
        allowPositionals: true,
        options: {
            page: { type: 'string' },
            'max-pages': { type: 'string' },
            referer: { type: 'string' },
            'user-agent': { type: 'string' },
            help: { type: 'boolean', short: 'h' },
            version: { type: 'boolean', short: 'v' },
        },
    });

    if (values.version) {
        console.log(CLI_VERSION);
        return;
    }

    const [command, arg] = positionals;
    if (values.help || !command) {
        console.log(HELP);
        return;
    }
    const userAgent = values['user-agent'];

    switch (command) {
        case 'search': {
            if (!arg) fail('search requires a <query> argument');
            const page = values.page ? parsePositiveInt(values.page, '--page') : 1;
            // strict mode so failures (anti-spider, network) surface as errors
            // instead of silently printing an empty array
            const results = await sogouWeixinSearch(arg, page, true, userAgent);
            console.log(JSON.stringify(results, null, 2));
            break;
        }
        case 'search-all': {
            if (!arg) fail('search-all requires a <query> argument');
            const maxPages = values['max-pages']
                ? parsePositiveInt(values['max-pages'], '--max-pages')
                : 10;
            const results = await sogouWeixinSearchAll(arg, maxPages, userAgent);
            console.log(JSON.stringify(results, null, 2));
            break;
        }
        case 'content': {
            if (!arg) fail('content requires a <real_url> argument');
            const content = await getArticleContent(arg, values.referer, userAgent);
            // getArticleContent reports failures as strings rather than
            // throwing (kept for API parity with the original Python project),
            // so map that sentinel prefix to a proper CLI error here
            if (content.startsWith('Failed to get article content:')) {
                fail(content);
            }
            console.log(content);
            break;
        }
        case 'skill': {
            // SKILL.md ships at the package root, one level above dist/ (or src/
            // when running from source), so agents can learn usage via
            // `wx-search skill`
            const skillPath = join(
                dirname(fileURLToPath(import.meta.url)),
                '..',
                'SKILL.md',
            );
            console.log(readFileSync(skillPath, 'utf8'));
            break;
        }
        default:
            fail(`unknown command "${command}"`);
    }
}

main().catch((error) => {
    fail(error instanceof Error ? error.message : String(error));
});

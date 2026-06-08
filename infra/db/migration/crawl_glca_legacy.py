#!/usr/bin/env python3
"""
协会旧网站 (https://www.glca.org.cn) 数据抓取脚本
技术栈: Nuxt.js SSR + __NUXT_DATA__ 序列化数据

抓取内容:
  - 新闻中心 (/news/)     -> portal_article (category_id=NEWS)
  - 政策法规 (/policy/)   -> portal_article (category_id=POLICY)
  - 活动专区 (/activity/) -> portal_activity
  - 通知公告 (/notice/)   -> portal_article (category_id=NOTICE) [旧站无数据]

输出:
  - SQL 插入脚本 (stdout 或文件)
"""
import urllib.request
import re
import json
import html as html_mod
import sys
from urllib.parse import urljoin

BASE = 'https://www.glca.org.cn'
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'}


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode('utf-8', errors='replace')


def get_nuxt_data(text):
    m = re.search(r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>', text, re.S)
    return json.loads(m.group(1)) if m else []


def resolve_once(data, v):
    if isinstance(v, list) and len(v) == 2 and v[0] in ('ShallowReactive', 'Reactive', 'Ref'):
        return resolve_once(data, v[1])
    if isinstance(v, int) and 0 <= v < len(data):
        return data[v]
    return v


def extract_list(data, list_key):
    """从 Nuxt data 中提取文章列表（单层解析，避免循环引用）"""
    for i, v in enumerate(data):
        if isinstance(v, dict) and list_key in v:
            list_idx = v[list_key]
            article_indices = resolve_once(data, list_idx)
            if not isinstance(article_indices, list):
                if isinstance(article_indices, dict) and 'list' in article_indices:
                    article_indices = resolve_once(data, article_indices['list'])
                if not isinstance(article_indices, list):
                    return []
            articles = []
            for idx in article_indices:
                raw = resolve_once(data, idx)
                if not isinstance(raw, dict):
                    continue
                art = {}
                for k, v in raw.items():
                    art[k] = resolve_once(data, v)
                articles.append(art)
            return articles
    return []


def extract_detail(data):
    """从详情页 Nuxt data 中提取文章详情"""
    for i, v in enumerate(data):
        if isinstance(v, dict):
            for k in v.keys():
                if 'detail' in k.lower():
                    detail = resolve_once(data, v[k])
                    if isinstance(detail, dict) and 'article' in detail:
                        article = resolve_once(data, detail['article'])
                        if isinstance(article, dict):
                            result = {}
                            for ak, av in article.items():
                                result[ak] = resolve_once(data, av)
                            return result
    return None


def make_full_url(path):
    if not path:
        return ''
    if path.startswith('http'):
        return path
    if path.startswith('//'):
        return 'https:' + path
    return urljoin(BASE, path)


def clean_content(content):
    if not content:
        return ''
    content = re.sub(r'src=["\']glcplatimage/', 'src="/glcplatimage/', content)
    content = re.sub(r'src=["\']crmebimage/', 'src="/crmebimage/', content)

    def replace_src(m):
        return f'src="{make_full_url(m.group(1))}"'
    content = re.sub(r'src="([^"]+)"', replace_src, content)
    return content


def escape_sql(val):
    if val is None:
        return 'NULL'
    s = str(val)
    s = s.replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"


def extract_summary(content, title, max_len=150):
    if not content:
        return title
    text = re.sub(r'<[^>]+>', ' ', content)
    text = html_mod.unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:max_len] + ('...' if len(text) > max_len else '')


def enrich_items(items, detail_path_prefix):
    """抓取详情并补充字段"""
    full = []
    for i, item in enumerate(items, 1):
        oid = item.get('id')
        title = item.get('title', '')
        print(f'  [{i}/{len(items)}] #{oid} {title[:30]}...', end='', flush=True, file=sys.stderr)
        try:
            detail_html = fetch(f'{BASE}{detail_path_prefix}{oid}')
            detail_data = get_nuxt_data(detail_html)
            detail = extract_detail(detail_data)
            if detail:
                item.update(detail)
        except Exception as e:
            print(f' ERR({e})', end='', file=sys.stderr)
        item['content'] = clean_content(item.get('content', ''))
        item['cover_url'] = make_full_url(item.get('imageInput', ''))
        item['summary'] = extract_summary(item.get('content'), item.get('synopsis', title))
        item['author'] = item.get('author', 'admin')
        item['view_count'] = item.get('visit', 0)
        item['is_top'] = 1 if item.get('isHot') else 0
        item['published_at'] = item.get('publishTime', item.get('createTime', ''))
        item['created_at'] = item.get('createTime', '')
        full.append(item)
        print(' OK', file=sys.stderr)
    return full


def generate_sql(news_full, policy_full, act_full):
    lines = []
    lines.append('-- ==========================================')
    lines.append('-- 绿产智链 portal 数据迁移脚本')
    lines.append('-- 来源: https://www.glca.org.cn/ (协会旧站)')
    lines.append('-- 生成时间: 2026-06-06')
    lines.append('-- ==========================================')
    lines.append('')
    lines.append('USE gl_portal;')
    lines.append('')

    lines.append('-- 1. 初始化栏目 (若不存在)')
    lines.append("INSERT IGNORE INTO portal_category (id, parent_id, name, code, sort_order, is_visible, created_at, updated_at) VALUES")
    lines.append("  (1, NULL, '新闻中心', 'NEWS', 1, 1, NOW(), NOW()),")
    lines.append("  (2, NULL, '通知公告', 'NOTICE', 2, 1, NOW(), NOW()),")
    lines.append("  (3, NULL, '政策法规', 'POLICY', 3, 1, NOW(), NOW()),")
    lines.append("  (4, NULL, '活动专区', 'ACTIVITY', 4, 1, NOW(), NOW());")
    lines.append('')

    def fix_dt(dt):
        if not dt:
            return 'NULL'
        if len(str(dt)) <= 10:
            return escape_sql(str(dt) + ' 00:00:00')
        return escape_sql(str(dt))

    if news_full:
        lines.append('-- 2. 新闻中心 (category_id=1)')
        lines.append('INSERT INTO portal_article')
        lines.append('  (category_id, title, content, summary, cover_url, author, view_count, is_top, is_published, published_at, publisher_id, is_deleted, created_at, updated_at)')
        lines.append('VALUES')
        vals = []
        for item in news_full:
            vals.append(f"  (1, {escape_sql(item['title'])}, {escape_sql(item['content'])}, {escape_sql(item['summary'])}, {escape_sql(item['cover_url'])}, {escape_sql(item['author'])}, {item['view_count'] or 0}, {item['is_top']}, 1, {fix_dt(item['published_at'])}, 1, 0, {fix_dt(item['created_at'])}, {fix_dt(item['created_at'])})")
        lines.append(',\n'.join(vals) + ';')
        lines.append('')

    if policy_full:
        lines.append('-- 3. 政策法规 (category_id=3)')
        lines.append('INSERT INTO portal_article')
        lines.append('  (category_id, title, content, summary, cover_url, author, view_count, is_top, is_published, published_at, publisher_id, is_deleted, created_at, updated_at)')
        lines.append('VALUES')
        vals = []
        for item in policy_full:
            vals.append(f"  (3, {escape_sql(item['title'])}, {escape_sql(item['content'])}, {escape_sql(item['summary'])}, {escape_sql(item['cover_url'])}, {escape_sql(item['author'])}, {item['view_count'] or 0}, {item['is_top']}, 1, {fix_dt(item['published_at'])}, 1, 0, {fix_dt(item['created_at'])}, {fix_dt(item['created_at'])})")
        lines.append(',\n'.join(vals) + ';')
        lines.append('')

    if act_full:
        lines.append('-- 4. 活动 (portal_activity)')
        lines.append('INSERT INTO portal_activity')
        lines.append('  (title, content, cover_url, location, start_time, end_time, reg_deadline, max_capacity, reg_count, status, is_deleted, created_at, updated_at)')
        lines.append('VALUES')
        vals = []
        for item in act_full:
            pt = item.get('publishTime', item.get('createTime', ''))
            vals.append(f"  ({escape_sql(item['title'])}, {escape_sql(item['content'])}, {escape_sql(item['cover_url'])}, {escape_sql('山东省')}, {fix_dt(pt)}, {fix_dt(pt)}, {fix_dt(pt)}, NULL, 0, 3, 0, {fix_dt(item['created_at'])}, {fix_dt(item['created_at'])})")
        lines.append(',\n'.join(vals) + ';')
        lines.append('')

    return '\n'.join(lines)


def main():
    print('=== 1. 抓取新闻 ===', file=sys.stderr)
    news_items = extract_list(get_nuxt_data(fetch(BASE + '/news/')), 'news-articles-812')
    print(f'列表页: {len(news_items)} 条', file=sys.stderr)
    news_full = enrich_items(news_items, '/news/')

    print('\n=== 2. 抓取政策 ===', file=sys.stderr)
    policy_items = extract_list(get_nuxt_data(fetch(BASE + '/policy/')), 'policy-articles-819')
    print(f'列表页: {len(policy_items)} 条', file=sys.stderr)
    policy_full = enrich_items(policy_items, '/policy/')

    print('\n=== 3. 抓取活动 ===', file=sys.stderr)
    act_items = extract_list(get_nuxt_data(fetch(BASE + '/activity/')), 'activity-articles-813')
    print(f'列表页: {len(act_items)} 条', file=sys.stderr)
    act_full = enrich_items(act_items, '/activity/')

    sql = generate_sql(news_full, policy_full, act_full)
    print(sql)

    print(f'\n-- 统计: 新闻 {len(news_full)} 条, 政策 {len(policy_full)} 条, 活动 {len(act_full)} 条', file=sys.stderr)


if __name__ == '__main__':
    main()

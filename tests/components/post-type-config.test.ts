import { readFileSync } from 'fs';
import path from 'path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  postTypeConfig,
  unknownPostTypeConfig,
  resolvePostTypeConfig,
  filterTabs,
} from '@/components/Blog/postTypeConfig';

// D1 的 postType 是自由文字欄位，曾經漂移出 union（'Project' 被錯標成「個人學習」）。
// 資料修正後前台已經沒有未知型別，所以這條 fallback 在網站上看不到，
// 只能靠這支測試證明它還在、而且顯示的是中性標籤而非某個真實分類。
describe('postTypeConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('四種宣告型別各自對應到自己的標籤', () => {
    expect(resolvePostTypeConfig('Learning')).toBe(postTypeConfig.Learning);
    expect(resolvePostTypeConfig('Tools')).toBe(postTypeConfig.Tools);
    expect(resolvePostTypeConfig('Work').label).toBe('工作專案');
    expect(resolvePostTypeConfig('Daily')).toBe(postTypeConfig.Daily);
  });

  it('未知型別回傳「未分類」，不會靜默 fallback 成個人學習', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cfg = resolvePostTypeConfig('Bogus');
    expect(cfg).toBe(unknownPostTypeConfig);
    expect(cfg.label).toBe('未分類');
    expect(cfg.label).not.toBe(postTypeConfig.Learning.label);
  });

  it('filterTabs 只有「全部」加上四種宣告型別，不含未分類', () => {
    expect(filterTabs).toHaveLength(5);
    expect(filterTabs.map(t => t.key)).toEqual(['All', 'Learning', 'Tools', 'Work', 'Daily']);
    expect(filterTabs.some(t => t.label === unknownPostTypeConfig.label)).toBe(false);
  });

  // publish-post.mjs 是主要的發文路徑（cloudflare-use skill 的 d1-insert-post.cjs
  // 與 sync-notes.cjs 也能寫入），它放行的型別必須等於前台認得的型別，
  // 否則又會出現「D1 有、前台沒有」的漂移。順序也一起釘住，因為 filterTabs 依賴它。
  it('publish-post.mjs 放行的 postType 與前台對照表一致', () => {
    const src = readFileSync(path.resolve(__dirname, '../../scripts/publish-post.mjs'), 'utf8');
    const match = src.match(/const POST_TYPES = \[([^\]]+)\]/);
    expect(match).not.toBeNull();
    const cliTypes = match![1].split(',').map(s => s.trim().replace(/^'|'$/g, ''));
    expect(cliTypes).toEqual(Object.keys(postTypeConfig));
  });
});

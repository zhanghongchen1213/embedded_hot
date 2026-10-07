// Multi-source consensus promotion: an event reported by many independent sources admits its
// evidence reports past the score gate and the "adds value" check, behind the identity gate and an
// editor's veto. Promotions never fire a push, repeated promotion is a no-op, and mentions neither
// count toward the bar nor get promoted.
import { tag } from "./setup.ts";
import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";
import { randomUUID } from "node:crypto";
import { closeDb, sql } from "@aihot/backend/db";
import { upsertMaterial } from "@aihot/backend/content/materials";
import { getBoss, stopBoss } from "@aihot/backend/jobs/queue";
import { promoteStoryMembers, publishArticle } from "@aihot/backend/publication/publish";
import { buildApp } from "../apps/api/src/app.ts";

const T = tag();
const app = await buildApp();
before(async () => {
  await getBoss();
  mock.timers.enable({ apis: ["Date"], now: Date.now() });
});
after(async () => { mock.timers.reset(); await app.close(); await stopBoss(); await closeDb(); });

const read = async (path: string) => (await app.inject({ method: "GET", url: path })).body;

async function story(title: string) {
  const [s] = await sql<{ id: number }[]>`INSERT INTO stories (public_id, title) VALUES (${randomUUID()}, ${title}) RETURNING id`;
  return s!.id;
}

async function source(key: string) {
  const id = `promote-${T}-${key}`;
  await sql`INSERT INTO sources(id,name,kind,tier,participation_mode,next_fetch_at)
    VALUES (${id},${key},'rss','T1','editorial','2100-01-01')`;
  return id;
}

/** A scored-but-rejected report of the story (30 < T1 threshold 60), confirmed as adding no value. */
async function report(storyId: number, key: string, opts: { role?: string } = {}) {
  const sourceId = await source(key);
  const { articleId } = await upsertMaterial({ sourceId, url: `https://example.org/${T}/${key}`,
    title: `${T} ${key}`, bodyText: 'A widely reported announcement.', bodyStatus: 'ok', via: 'fetch', publishedAt: new Date() });
  await sql`INSERT INTO analyses(article_id,input_revision,origin,relevance,category,title_zh,summary_zh,reason_zh,score,selected)
    VALUES (${articleId},1,'rule','pass','industry-event',${`报道 ${T} ${key}`},'广泛报道的发布','低于门槛',30,false)`;
  const [f] = await sql`INSERT INTO facts (public_id,story_id,title) VALUES (${randomUUID()},${storyId},${key}) RETURNING id`;
  await sql`INSERT INTO fact_articles (fact_id,article_id,role) VALUES (${f!.id},${articleId},${opts.role ?? 'report'})`;
  await sql`UPDATE articles SET grouping_status='complete',grouped_at=now(),selection_adds_value=false WHERE id=${articleId}`;
  await publishArticle(articleId);
  return articleId;
}

const selectedIn = async (id: string) => (await sql`SELECT selected FROM publications WHERE article_id=${id}`)[0]!.selected;

test('nine sources stay out; the tenth admits the story’s earlier reports without a push', async () => {
  const s = await story(`九源 ${T}`);
  const ids: string[] = [];
  for (let i = 1; i <= 9; i++) ids.push(await report(s, `nine-${i}`));
  for (const id of ids) assert.equal(await selectedIn(id), false, `${id} leaked before the bar`);
  assert.equal(await promoteStoryMembers(s), 0, 'nine sources must not promote');

  const tenth = await report(s, "nine-10");
  assert.equal(await selectedIn(tenth), true, 'the tenth report is promoted on arrival');
  assert.ok((await promoteStoryMembers(s)) >= 9, 'the earlier reports are admitted too');
  mock.timers.tick(5_100);
  for (const id of [...ids, tenth]) {
    assert.equal(await selectedIn(id), true, `${id} missing after promotion`);
    assert.ok((await read('/api/site/timeline?limit=60')).includes(id), `${id} hidden from the timeline`);
    assert.equal((await sql`SELECT 1 FROM selected_ledger WHERE article_id=${id} AND op='upsert'`).length, 1);
  }
  assert.equal((await sql`SELECT 1 FROM pgboss.job WHERE name='notify.selected' AND data->>'articleId' LIKE ${`%${T}%`}`).length, 0,
    'promotion must not push');
  assert.equal(await promoteStoryMembers(s), 0, 'a second pass admits nothing new');
  assert.equal((await sql`SELECT 1 FROM selected_ledger WHERE article_id=${ids[0]} AND op='upsert'`).length, 1, 'ledger stays idempotent');
});

test('the identity gate and an editor’s veto both beat promotion', async () => {
  const s = await story(`门禁 ${T}`);
  const ids: string[] = [];
  for (let i = 1; i <= 9; i++) ids.push(await report(s, `gate-${i}`));
  const stuck = await report(s, "gate-stuck");
  await sql`UPDATE articles SET grouping_status='failed' WHERE id=${stuck}`;
  await publishArticle(stuck);
  const vetoed = await report(s, "gate-veto");
  await sql`INSERT INTO editorial_overrides(article_id,fields,reason,updated_by) VALUES (${vetoed},'{"selected":false}','editor rejected','test')`;
  await publishArticle(vetoed);
  await promoteStoryMembers(s);
  assert.equal(await selectedIn(stuck), false, 'an unresolved identity must not be promoted');
  assert.equal(await selectedIn(vetoed), false, 'an editor’s veto must beat promotion');
  for (const id of ids) assert.equal(await selectedIn(id), true);
});

test('mentions neither count toward the bar nor get promoted', async () => {
  const s = await story(`提及 ${T}`);
  const ids: string[] = [];
  for (let i = 1; i <= 8; i++) ids.push(await report(s, `mention-${i}`));
  const mention = await report(s, "mention-only", { role: "mention" });
  await report(s, "mention-9");
  assert.equal(await promoteStoryMembers(s), 0, 'eight reports plus a mention is still nine sources');
  assert.equal(await selectedIn(mention), false, 'a mention is never promoted');
  await report(s, "mention-10");
  await promoteStoryMembers(s);
  assert.equal(await selectedIn(mention), false, 'a mention stays out even past the bar');
  assert.equal(await selectedIn(ids[0]), true);
});

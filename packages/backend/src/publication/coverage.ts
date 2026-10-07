// How widely a fact was reported: the editorial sources whose listed reports are evidence of it, by a
// cutoff, as the daily's "另有 N 家信源报道" counts it.
import { sql, type Db } from "../db.ts";
import { evidenceCondition, listedCondition } from "./scope.ts";

/** The editorial sources that reported each fact by the cutoff. */
export async function factSources(factIds: number[], end: Date): Promise<Map<number, string[]>> {
  if (factIds.length === 0) return new Map();
  const rows = await sql<{ fact_id: number; sources: string[] }[]>`
    SELECT fa.fact_id, array_agg(DISTINCT p.source_id) AS sources
    FROM fact_articles fa JOIN publications p ON p.article_id = fa.article_id JOIN sources s ON s.id = p.source_id
    WHERE fa.fact_id = ANY(${factIds}::bigint[]) AND ${evidenceCondition()} AND ${listedCondition(end)}
      AND s.participation_mode = 'editorial' AND p.timeline_at < ${end}
    GROUP BY fa.fact_id`;
  return new Map(rows.map((r) => [r.fact_id, r.sources]));
}

/** The editorial sources that reported each story by the cutoff: the union over its facts.
 *  Unlike the daily's cutoff, "by now" includes this very instant, so a row published in the
 *  current transaction already counts toward the promotion bar. */
export async function storySources(storyIds: number[], end: Date, db: Db = sql): Promise<Map<number, string[]>> {
  if (storyIds.length === 0) return new Map();
  const rows = await db<{ story_id: number; sources: string[] }[]>`
    SELECT f.story_id, array_agg(DISTINCT p.source_id) AS sources
    FROM facts f JOIN fact_articles fa ON fa.fact_id = f.id JOIN publications p ON p.article_id = fa.article_id JOIN sources s ON s.id = p.source_id
    WHERE f.story_id = ANY(${storyIds}::bigint[]) AND ${evidenceCondition()} AND ${listedCondition(end)}
      AND s.participation_mode = 'editorial' AND p.timeline_at <= ${end}
    GROUP BY f.story_id`;
  return new Map(rows.map((r) => [r.story_id, r.sources]));
}

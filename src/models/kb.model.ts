import { db } from "../db/index";

export async function searchKBArticlesModel(query?: string) {
  if (query) {
    const q = `%${String(query).toLowerCase()}%`;
    return db.query(
      `SELECT * FROM kb_articles WHERE LOWER(title) LIKE $1 OR LOWER(body) LIKE $1 ORDER BY created_at DESC`,
      [q]
    );
  }
  return db.query("SELECT * FROM kb_articles ORDER BY created_at DESC");
}

export async function updateKBArticleModel(
  id: string,
  title?: string,
  body?: string,
  tags?: string[]
) {
  return db.query(
    `UPDATE kb_articles SET
      title = COALESCE($1, title),
      content = COALESCE($2, body),
      tags = COALESCE($3, tags),
      updated_at = NOW()
    WHERE id = $4 RETURNING *`,
    [title, body, tags, id]
  );
}

export async function getKBArticlesModel() {
  return db.query("SELECT * FROM kb_articles ORDER BY created_at DESC");
}

export async function createKBArticleModel(
  title: string,
  content: string,
  tags: string[],
  createdBy: string,
  guid: string
) {
  return db.query(
    `INSERT INTO kb_articles (title, content, tags, created_by, guid) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, content, tags, createdBy, guid]
  );
}

const { createClient } = require("@libsql/client");

console.log("TURSO_DATABASE_URL existe:", !!process.env.TURSO_DATABASE_URL);
console.log("TURSO_AUTH_TOKEN existe:", !!process.env.TURSO_AUTH_TOKEN);

const TABLE = "estudos_painel";

function getClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  console.log("ENV TURSO URL:", !!url);
  console.log("ENV TURSO TOKEN:", !!authToken);

  if (!url) {
    throw new Error("TURSO_DATABASE_URL não chegou na Vercel.");
  }

  if (!authToken) {
    throw new Error("TURSO_AUTH_TOKEN não chegou na Vercel.");
  }

  return createClient({
    url,
    authToken
  });
}function getClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error(
      "TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN não configurado."
    );
  }

  return createClient({
    url,
    authToken
  });
}

async function ensureTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS estudos_painel (
      user_key TEXT PRIMARY KEY,
      state TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

function validUserKey(value) {
  return (
    typeof value === "string" &&
    /^[a-zA-Z0-9_-]{1,80}$/.test(value)
  );
}

module.exports = async function handler(req, res) {
  try {
    const client = getClient();

    await ensureTable(client);

    if (req.method === "GET") {
      const userKey = req.query?.user_key || "samuel";

      if (!validUserKey(userKey)) {
        return res.status(400).json({
          error: "user_key inválido."
        });
      }

      const result = await client.execute({
        sql: `
          SELECT state, updated_at
          FROM estudos_painel
          WHERE user_key = ?
        `,
        args: [userKey]
      });

      if (!result.rows.length) {
        return res.status(200).json({
          state: null,
          updated_at: null
        });
      }

      return res.status(200).json({
        state: JSON.parse(result.rows[0].state),
        updated_at: result.rows[0].updated_at
      });
    }

    if (req.method === "POST") {
      const body =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body;

      const userKey = body?.user_key || "samuel";
      const state = body?.state;

      if (!validUserKey(userKey)) {
        return res.status(400).json({
          error: "user_key inválido."
        });
      }

      if (
        !state ||
        typeof state !== "object" ||
        Array.isArray(state)
      ) {
        return res.status(400).json({
          error: "state inválido."
        });
      }

      const updatedAt = new Date().toISOString();

      await client.execute({
        sql: `
          INSERT INTO estudos_painel
            (user_key, state, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(user_key)
          DO UPDATE SET
            state = excluded.state,
            updated_at = excluded.updated_at
        `,
        args: [
          userKey,
          JSON.stringify(state),
          updatedAt
        ]
      });

      return res.status(200).json({
        ok: true,
        updated_at: updatedAt
      });
    }

    res.setHeader("Allow", "GET, POST");

    return res.status(405).json({
      error: "Método não permitido."
    });

  } catch (error) {
    console.error("API /api/state:", error);

    return res.status(500).json({
      error: "Erro interno ao acessar o Turso."
    });
  }
};

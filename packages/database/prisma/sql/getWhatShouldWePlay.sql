-- @param {String} $1:guildId Guild ID to filter games by
-- @param {Boolean} $3:ignoreMaxPlayers Ignores max player requirements of games
-- @param {Boolean} $4:ignoreMinPlayers Ignores min player requirements of games
-- @param {Int} $5:page Page number for pagination (1 per page + 1 pagination)
SELECT
  games.id AS id,
  games.free AS free,
  games.game_url AS game_url,
  games.max_players AS max_players,
  games.min_players AS min_players,
  games.name AS name,
  game_resources.banner_image_url AS banner_image_url,
  game_resources.description AS description,
  game_resources.thumbnail_image_url AS thumbnail_image_url,
  COALESCE(avg_score, 0) AS avg_score
FROM games
LEFT JOIN (
  SELECT game_id, COALESCE(AVG(score), 0) AS avg_score
  FROM ratings
  INNER JOIN games ON games.id = ratings.game_id
  INNER JOIN users ON users.id = ratings.user_id
  WHERE games.guild_id = $1
  AND ($3 OR games.max_players >= ARRAY_LENGTH($2::text[], 1))
  AND ($4 OR games.min_players <= ARRAY_LENGTH($2::text[], 1))
  AND games.released = true
  AND users.discord_id = ANY($2)
  GROUP BY game_id
) avg_ratings ON avg_ratings.game_id = games.id
LEFT JOIN game_resources ON game_resources.id = games.game_resource_id
WHERE games.guild_id = $1
AND ($3 OR games.max_players >= ARRAY_LENGTH($2::text[], 1))
AND ($4 OR games.min_players <= ARRAY_LENGTH($2::text[], 1))
AND games.released = true
ORDER BY COALESCE(avg_score, 0) DESC
LIMIT 2
OFFSET $5 - 1;

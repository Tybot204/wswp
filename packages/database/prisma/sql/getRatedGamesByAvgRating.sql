-- @param {String} $1:guildId Guild ID to filter games by
-- @param {Int} $3:page Page number for pagination (5 per page)
SELECT *
FROM games
INNER JOIN (
  SELECT game_id, AVG(score) AS avg_score, COUNT(DISTINCT ratings.user_id) AS user_count
  FROM ratings
  INNER JOIN games ON games.id = ratings.game_id
  INNER JOIN users ON users.id = ratings.user_id
  WHERE games.guild_id = $1
  AND users.discord_id = ANY($2)
  GROUP BY game_id
  HAVING COUNT(DISTINCT ratings.user_id) = array_length($2::text[], 1)
) avg_ratings ON avg_ratings.game_id = games.id
WHERE games.guild_id = $1
ORDER BY COALESCE(avg_score, 0) DESC
LIMIT 6
OFFSET 5 * ($3 - 1);

-- @param {String} $1:guildId Guild ID to filter games by
-- @param {Int} $3:page Page number for pagination (5 per page)
SELECT *
FROM games
LEFT JOIN (
  SELECT game_id, AVG(score) AS avg_score
  FROM ratings
  INNER JOIN games ON games.id = ratings.game_id
  WHERE games.guild_id = $1
  GROUP BY game_id
) avg_ratings ON avg_ratings.game_id = games.id
WHERE games.guild_id = $1
ORDER BY COALESCE(avg_score, 0) DESC
LIMIT 6
OFFSET 5 * ($2 - 1);

import { Command } from "..";

import { addGame } from "./addGame";
import { listGames } from "./listGames";
import { rateGames } from "./rateGames";
import { rateSingleGame } from "./rateSingleGame";
import { removeGame } from "./removeGame";
import { whatShouldWePlay } from "./whatShouldWePlay";

export const commandMap: { [key: string]: Command } = {
  addgame: addGame,
  listgames: listGames,
  rategames: rateGames,
  ratesinglegame: rateSingleGame,
  removegame: removeGame,
  whatshouldweplay: whatShouldWePlay,
};

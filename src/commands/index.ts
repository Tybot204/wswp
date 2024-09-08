import { Command } from "..";

import { addGame } from "./addGame";
import { listGames } from "./listGames";
import { rateGames } from "./rateGames";
import { removeGame } from "./removeGame";
import { whatShouldWePlay } from "./whatShouldWePlay";

export const commandMap: { [key: string]: Command } = {
  addgame: addGame,
  listgames: listGames,
  rategames: rateGames,
  removegame: removeGame,
  whatshouldweplay: whatShouldWePlay,
};

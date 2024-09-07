import { Command } from "..";

import { addGame } from "./addGame";
import { listGames } from "./listGames";
import { rateGames } from "./rateGames";

export const commandMap: { [key: string]: Command } = {
  addgame: addGame,
  listgames: listGames,
  rategames: rateGames,
};

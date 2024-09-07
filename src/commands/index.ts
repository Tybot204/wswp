import { Command } from "..";

import { addGame } from "./addGame";
import { listGames } from "./listGames";

export const commandMap: { [key: string]: Command } = {
  addgame: addGame,
  listgames: listGames,
};

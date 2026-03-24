/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2025 Caleb Gyamfi – Omnixys Technologies
 *
 * For full license text, see <https://www.gnu.org/licenses/>.
 */

import type { Logger } from "pino";
import { parentLogger } from "./logger.config.js";

/**
 * Liefert einen kontextgebundenen Pino-Logger.
 *
 * @param context Name oder Pfad (z. B. Klassenname)
 * @param kind    Key unter dem der Kontext gespeichert wird (z. B. `class`, `service`)
 */
export function getLogger(context: string, kind: string = "class"): Logger {
  const bindings: Record<string, string> = { [kind]: context };
  return parentLogger.child(bindings);
}

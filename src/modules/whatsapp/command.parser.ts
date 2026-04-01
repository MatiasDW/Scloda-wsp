export type CommandType = "JOIN" | "LEAVE" | "DEBT" | "PAID" | "STATUS" | "SETUP_MATCH" | "UNKNOWN";

export function parseCommand(body: string): CommandType {
  const normalized = body.trim().toLowerCase();

  if (["me sumo", "sumo", "confirmo"].includes(normalized)) {
    return "JOIN";
  }

  if (["me bajo", "bajo", "no voy"].includes(normalized)) {
    return "LEAVE";
  }

  if (["cuanto debo", "cuánto debo", "debo"].includes(normalized)) {
    return "DEBT";
  }

  if (["ya pague", "ya pagué", "pague", "pague ya"].includes(normalized)) {
    return "PAID";
  }

  if (["estado", "resumen"].includes(normalized)) {
    return "STATUS";
  }

  if (["configurar partido", "crear partido", "nuevo partido", "setup partido"].includes(normalized)) {
    return "SETUP_MATCH";
  }

  return "UNKNOWN";
}

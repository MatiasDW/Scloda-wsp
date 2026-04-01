export type CommandType =
  | "JOIN"
  | "LEAVE"
  | "DEBT"
  | "PAID"
  | "STATUS"
  | "SETUP_MATCH"
  | "RESTAURANT_CREATE"
  | "RESTAURANT_JOIN"
  | "RESTAURANT_LEAVE"
  | "RESTAURANT_ITEM"
  | "RESTAURANT_STATUS"
  | "RESTAURANT_CLOSE"
  | "RESTAURANT_HELP"
  | "UNKNOWN";

export function parseCommand(body: string): CommandType {
  const normalized = body.trim().toLowerCase();

  if (
    ["configurar partido", "crear partido", "nuevo partido", "setup partido"].includes(normalized)
  ) {
    return "SETUP_MATCH";
  }

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

  if (
    ["salida ayuda", "ayuda salida", "cuenta ayuda", "salida menu", "salida menú"].includes(
      normalized
    )
  ) {
    return "RESTAURANT_HELP";
  }

  if (
    ["salida crear", "crear salida", "abrir salida", "salida nueva", "nueva salida"].includes(
      normalized
    ) ||
    normalized.startsWith("salida crear ")
  ) {
    return "RESTAURANT_CREATE";
  }

  if (["salida me sumo", "salida sumo", "sumarme salida"].includes(normalized)) {
    return "RESTAURANT_JOIN";
  }

  if (["salida me bajo", "salida bajo", "bajarme salida"].includes(normalized)) {
    return "RESTAURANT_LEAVE";
  }

  if (
    ["salida estado", "salida resumen", "estado salida", "resumen salida", "salida lista"].includes(
      normalized
    )
  ) {
    return "RESTAURANT_STATUS";
  }

  if (["salida cerrar", "cerrar salida", "salida cerrar cuenta"].includes(normalized)) {
    return "RESTAURANT_CLOSE";
  }

  if (normalized.startsWith("salida consumo ") || normalized.startsWith("consumo ")) {
    return "RESTAURANT_ITEM";
  }

  return "UNKNOWN";
}

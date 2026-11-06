export function authSecret(): string | null {
  const password = process.env.MISSION_CONTROL_PASSWORD;
  if (!password) return null;
  return process.env.MISSION_CONTROL_SECRET || password;
}

import "server-only";
import type { Backend } from "../types";
import { createAgent, getAgent, listAgents, updateAgent } from "./agents";
import { confirmTool, interrupt, listEvents, openStream, sendMessage } from "./events";
import { createRun, getRun, listRuns, markSeen } from "./runs";

export const liveBackend: Backend = {
  mode: "live",
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  listRuns,
  getRun,
  createRun,
  listEvents,
  openStream,
  sendMessage,
  interrupt,
  confirmTool,
  markSeen,
};

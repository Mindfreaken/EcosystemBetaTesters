import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { register as registerChat } from "./crons/chat";
import { register as registerSocialScore } from "./crons/socialScore";
import { register as registerPunishments } from "./crons/punishments";
import { register as registerOverseer } from "./crons/overseer";
import { register as registerSpaces } from "./crons/spaces";


const crons = cronJobs();

// Modular registrations
registerSocialScore(crons);
registerPunishments(crons);
registerOverseer(crons);
registerSpaces(crons);

// Register chat domain jobs
registerChat(crons);

export default crons;
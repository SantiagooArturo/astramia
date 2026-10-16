import { Elysia } from "elysia";
import { trackEventsRoute } from "./routes/track-events.route";

export const analyticsRouter = new Elysia().use(trackEventsRoute);

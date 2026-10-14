import "server-only";
import type { Reading } from "@/core/reading/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { findReading } from "../repository/readings";
import { toReading } from "../repository/utils";

export async function getReadingService(
    userId: string,
    id: string,
): AsyncAppResult<Reading> {
    try {
        const row = await findReading(userId, id);
        if (!row) return err(AppErrors.notFound({ targets: ["reading"] }));
        return ok(toReading(row));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}

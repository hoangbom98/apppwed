import { NextRequest } from "next/server";
import { settingsService } from "@/services";
import { settingsSchema, formatZodErrors } from "@/validators";
import {
  successResponse,
  validationErrorResponse,
  serverErrorResponse,
} from "@/utils/api-response";
import { handleError } from "@/utils/errors";

export async function GET() {
  try {
    const settings = await settingsService.getSettings();
    return successResponse(settings);
  } catch (error) {
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(formatZodErrors(parsed.error));
    }

    const settings = await settingsService.updateSettings(parsed.data);
    return successResponse(settings, "Settings updated successfully");
  } catch (error) {
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}

import { dashboardService } from "@/services";
import { successResponse, serverErrorResponse } from "@/utils/api-response";
import { handleError } from "@/utils/errors";

export async function GET() {
  try {
    const stats = await dashboardService.getDashboardStats();
    return successResponse(stats);
  } catch (error) {
    const { message } = handleError(error);
    return serverErrorResponse(message);
  }
}

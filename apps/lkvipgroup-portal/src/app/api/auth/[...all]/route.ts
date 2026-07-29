// Better Auth đã bị loại bỏ — endpoint này disabled
import { NextResponse } from "next/server";

function disabled() {
  return NextResponse.json(
    { success: false, message: "Authentication endpoint disabled" },
    { status: 404 }
  );
}

export { disabled as GET, disabled as POST, disabled as PUT, disabled as PATCH, disabled as DELETE };

import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // Clear auth cookies
  cookieStore.delete("userId");
  cookieStore.delete("username");

  return Response.json({ success: true });
}

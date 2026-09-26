import { httpClient } from "@wix/essentials";
const origin = new URL(import.meta.url).origin;
export class ClientError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const response = await httpClient.fetchWithAuth(`${origin}/api/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success)
    throw new ClientError(
      payload.message || "Request failed. Please try again.",
      response.status,
    );
  return payload.data as T;
}

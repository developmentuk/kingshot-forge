import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import {
  requireForgeActor,
} from "../../server/auth/requireForgeActor.js";
import {
  executeEditorialAction,
  type EditorialActionBody,
} from "../../server/editorial/executeEditorialAction.js";
import {
  sendEditorialError,
} from "../../server/editorial/http.js";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({
      status: "error",
      message: "Method not allowed.",
    });
    return;
  }

  try {
    const actor =
      await requireForgeActor(request);
    const result =
      await executeEditorialAction(
        request.body as EditorialActionBody,
        actor,
      );

    response.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    sendEditorialError(response, error);
  }
}

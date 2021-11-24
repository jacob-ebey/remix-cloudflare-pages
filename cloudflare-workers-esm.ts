import type { ServerBuild, AppLoadContext } from "@remix-run/server-runtime";
import { createRequestHandler as createRemixRequestHandler } from "@remix-run/server-runtime";

interface CreateRequestHandlerParams {
  build: ServerBuild;
  getLoadContext?: (args: {
    request: Request;
    env: unknown;
    context: ExecutionContext;
  }) => AppLoadContext;
  mode?: string;
}

function createRequestHandler({
  build,
  getLoadContext,
  mode,
}: CreateRequestHandlerParams): ExportedHandlerFetchHandler<unknown> {
  let platform = {};
  let handleRequest = createRemixRequestHandler(build, platform, mode);

  return (request, env, context) => {
    let loadContext =
      typeof getLoadContext === "function"
        ? getLoadContext({ request, env, context })
        : undefined;
    return handleRequest(request, loadContext);
  };
}

type EnvWithAssets = Record<string, unknown> & {
  ASSETS: { fetch: typeof fetch };
};

async function handleAsset(request: Request, env: unknown) {
  let envWithAssets = env as EnvWithAssets;
  if (!envWithAssets?.ASSETS?.fetch) {
    throw new Error(
      "env.ASSETS.fetch does not exist, did you forget to upload your assets?"
    );
  }

  const response = await envWithAssets.ASSETS.fetch(request);
  if (response.ok) return response;
}

declare const process: any;

export function createFetchHandler({
  build,
  getLoadContext,
  mode,
}: CreateRequestHandlerParams) {
  const handleRequest = createRequestHandler({
    build,
    getLoadContext,
    mode,
  });

  const handleFetch = async (
    request: Request,
    env: unknown,
    context: ExecutionContext
  ) => {
    let url = new URL(request.url);
    let response =
      url.pathname === "" || url.pathname === "/"
        ? undefined
        : await handleAsset(request, env);

    if (!response) {
      response = await handleRequest(request, env, context);
    }

    return response;
  };

  return async (request: Request, env: unknown, context: ExecutionContext) => {
    try {
      return await handleFetch(request, env, context);
    } catch (e) {
      if (process.env.NODE_ENV === "development" && e instanceof Error) {
        return new Response(e.message || e.toString(), {
          status: 500,
        });
      }

      return new Response("Internal Error", {
        status: 500,
      });
    }
  };
}

import { createFetchHandler } from "../cloudflare-workers-esm";

// @ts-ignore
import * as build from "../build";

const handleFetch = createFetchHandler({
  build,
});

let handler: ExportedHandler = {
  fetch(request, env, context) {
    request = new Request(request);
    request.headers.delete("If-None-Match");

    return handleFetch(request, env, context);
  },
};

export default handler;

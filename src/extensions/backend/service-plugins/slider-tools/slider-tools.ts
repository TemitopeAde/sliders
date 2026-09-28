import { toolsProvider } from "@wix/app-tools/service-plugins";
import { runSliderTool } from "./slider-tools.logic";

toolsProvider.provideHandlers({
  runTool: async ({ request, metadata }) => ({
    response: await runSliderTool(
      request.methodName,
      request.payload,
      metadata,
    ),
  }),
});

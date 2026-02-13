import { anthropic } from "@ai-sdk/anthropic";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const THINKING_SUFFIX_REGEX = /-thinking$/;

// Map model IDs from "provider/model" format to just the model ID
function resolveModelId(modelId: string): string {
  // Strip provider prefix if present (e.g., "anthropic/claude-sonnet-4-5" -> "claude-sonnet-4-5")
  if (modelId.includes("/")) {
    return modelId.split("/").slice(1).join("/");
  }
  return modelId;
}

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const resolved = resolveModelId(modelId);

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  if (isReasoningModel) {
    const cleanId = resolved.replace(THINKING_SUFFIX_REGEX, "");

    return wrapLanguageModel({
      model: anthropic(cleanId),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return anthropic(resolved);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return anthropic("claude-opus-4-5");
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  return anthropic("claude-opus-4-5");
}

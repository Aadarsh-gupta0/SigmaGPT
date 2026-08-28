import config from "../config/index.js";
import {ProviderError} from "../lib/http.js";
import {createOpenAICompatibleProvider} from "./openaiCompatible.js";
import {createGeminiProvider} from "./gemini.js";

/**
 * Every provider here is free to use.
 *
 * Pollinations needs no account, so the app answers straight after
 * `npm install` — but its anonymous tier is rate limited per IP and returns
 * 402 once that budget is spent, so treat it as best effort. For day-to-day
 * use add one free API key (Groq and Gemini both issue them without a card)
 * and it becomes the primary provider automatically.
 */
const providers = [
    createOpenAICompatibleProvider({
        id: "pollinations",
        label: "Pollinations",
        description: "No account or API key. Great for a first run; the anonymous tier is rate limited.",
        docsUrl: "https://pollinations.ai",
        endpoint: "https://text.pollinations.ai/openai",
        model: config.models.pollinations,
        requiresKey: false
    }),

    createOpenAICompatibleProvider({
        id: "groq",
        label: "Groq",
        description: "Free tier running open Llama models on LPUs — the fastest option here.",
        docsUrl: "https://console.groq.com/keys",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        model: config.models.groq,
        apiKey: config.keys.groq,
        requiresKey: true,
        keyEnv: "GROQ_API_KEY"
    }),

    createGeminiProvider({
        apiKey: config.keys.gemini,
        model: config.models.gemini
    }),

    createOpenAICompatibleProvider({
        id: "openrouter",
        label: "OpenRouter",
        description: "Routes to community models; the configured model is a `:free` one.",
        docsUrl: "https://openrouter.ai/keys",
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        model: config.models.openrouter,
        apiKey: config.keys.openrouter,
        requiresKey: true,
        keyEnv: "OPENROUTER_API_KEY",
        extraHeaders: {
            "HTTP-Referer": config.appUrl,
            "X-Title": config.appName
        }
    }),

    createOpenAICompatibleProvider({
        id: "huggingface",
        label: "Hugging Face",
        description: "Free inference credits across open-weight models on the HF router.",
        docsUrl: "https://huggingface.co/settings/tokens",
        endpoint: "https://router.huggingface.co/v1/chat/completions",
        model: config.models.huggingface,
        apiKey: config.keys.huggingface,
        requiresKey: true,
        keyEnv: "HF_TOKEN"
    }),

    createOpenAICompatibleProvider({
        id: "ollama",
        label: "Ollama (local)",
        description: "Fully offline open-source models running on your own machine.",
        docsUrl: "https://ollama.com/download",
        endpoint: `${config.ollamaBaseUrl.replace(/\/$/, "")}/chat/completions`,
        model: config.models.ollama,
        requiresKey: false,
        local: true
    })
];

const byId = new Map(providers.map((provider) => [provider.id, provider]));

export const getProvider = (id) => byId.get(id);

/**
 * Resolution order: an explicit PROVIDER_ORDER wins, otherwise providers that
 * have credentials come first and the keyless ones act as a safety net.
 * Ollama is only auto-selected when explicitly ordered, since it needs a
 * running daemon we cannot assume is there.
 */
export function resolveOrder(preferredId) {
    const configured = config.providerOrder.length
        ? config.providerOrder.map((id) => byId.get(id)).filter(Boolean)
        : [
              ...providers.filter((p) => p.requiresKey && p.isConfigured()),
              ...providers.filter((p) => !p.requiresKey && !p.local)
          ];

    const preferred = preferredId ? byId.get(preferredId) : null;
    const chain = preferred ? [preferred, ...configured.filter((p) => p.id !== preferred.id)] : configured;

    const usable = chain.filter((provider) => provider.isConfigured());
    if (!usable.length) {
        throw new ProviderError("No answer provider is available. Check your Backend/.env configuration.");
    }

    return usable;
}

/** Everything the frontend needs to render the provider picker. */
export function describeProviders() {
    let active = [];
    try {
        active = resolveOrder().map((provider) => provider.id);
    } catch {
        active = [];
    }

    return {
        active: active[0] ?? null,
        fallbackChain: active,
        providers: providers.map((provider) => ({
            id: provider.id,
            label: provider.label,
            description: provider.description,
            docsUrl: provider.docsUrl,
            model: provider.model,
            requiresKey: provider.requiresKey,
            keyEnv: provider.keyEnv,
            local: provider.local,
            ready: provider.isConfigured()
        }))
    };
}

export default providers;

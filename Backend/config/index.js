import "dotenv/config";

const toInt = (value, fallback) => {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const csv = (value) =>
    (value ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

const DEFAULT_SYSTEM_PROMPT = [
    "You are SigmaGPT, a helpful, direct assistant.",
    "Write clear answers in Markdown. Use fenced code blocks with a language tag for code.",
    "Prefer short paragraphs and lists over walls of text, and say when you are unsure."
].join(" ");

export const config = {
    port: toInt(process.env.PORT, 8080),
    corsOrigin: process.env.CORS_ORIGIN || "*",

    // Storage. Mongo is used when a URI is present; otherwise chats persist to a JSON file.
    mongoUri: process.env.MONGODB_URI || "",
    dataDir: process.env.DATA_DIR || ".data",

    // Generation
    systemPrompt: process.env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT,
    historyLimit: toInt(process.env.HISTORY_LIMIT, 20),
    temperature: Number.parseFloat(process.env.TEMPERATURE ?? "0.7"),
    maxTokens: toInt(process.env.MAX_TOKENS, 2048),
    requestTimeoutMs: toInt(process.env.REQUEST_TIMEOUT_MS, 120000),

    // Comma separated provider ids; empty means "auto" (configured providers first).
    providerOrder: csv(process.env.PROVIDER_ORDER),

    keys: {
        groq: process.env.GROQ_API_KEY || "",
        gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
        openrouter: process.env.OPENROUTER_API_KEY || "",
        huggingface: process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || ""
    },

    models: {
        pollinations: process.env.POLLINATIONS_MODEL || "openai",
        groq: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        gemini: process.env.GEMINI_MODEL || "gemini-2.0-flash",
        openrouter: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
        huggingface: process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct",
        ollama: process.env.OLLAMA_MODEL || "llama3.2"
    },

    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",

    // Sent by OpenRouter clients for attribution; both are optional.
    appUrl: process.env.APP_URL || "http://localhost:5173",
    appName: process.env.APP_NAME || "SigmaGPT"
};

export default config;

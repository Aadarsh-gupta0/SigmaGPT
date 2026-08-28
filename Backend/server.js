import express from "express";
import cors from "cors";
import config from "./config/index.js";
import chatRoutes from "./routes/chat.js";
import {initStore, getStore} from "./store/index.js";
import {describeProviders} from "./providers/index.js";

const app = express();

app.use(express.json({limit: "1mb"}));
app.use(cors({origin: config.corsOrigin}));

app.get("/health", (req, res) => {
    const {active, fallbackChain} = describeProviders();
    res.json({status: "ok", storage: getStore().kind, provider: active, fallbackChain});
});

app.use("/api", chatRoutes);

app.use((req, res) => res.status(404).json({error: `No route for ${req.method} ${req.path}`}));

app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);
    res.status(500).json({error: "Internal server error"});
});

const start = async () => {
    await initStore();

    const {active, providers} = describeProviders();
    const ready = providers.filter((p) => p.ready).map((p) => p.id);

    if (!active) {
        console.warn("No answer provider is configured — see Backend/.env.example");
    } else {
        console.log(`Answer provider: ${active} (available: ${ready.join(", ")})`);
    }

    const server = app.listen(config.port, () => {
        console.log(`SigmaGPT API listening on http://localhost:${config.port}`);
    });

    const shutdown = async () => {
        server.close();
        await getStore().close?.();
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
};

start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});

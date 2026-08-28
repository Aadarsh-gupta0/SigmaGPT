import config from "../config/index.js";
import {createFileStore} from "./fileStore.js";
import {createMongoStore} from "./mongoStore.js";

let store = null;

/**
 * Prefers MongoDB when MONGODB_URI is set, but never lets a missing or
 * unreachable database stop the server from starting.
 */
export async function initStore() {
    if (store) return store;

    if (config.mongoUri) {
        try {
            store = await createMongoStore(config.mongoUri);
            console.log("Storage: MongoDB connected");
            return store;
        } catch (err) {
            console.warn(`Storage: MongoDB unavailable (${err.message}) — falling back to local file storage`);
        }
    }

    store = await createFileStore(config.dataDir);
    console.log(`Storage: ${store.describe()}`);
    return store;
}

export function getStore() {
    if (!store) throw new Error("Store accessed before initStore() completed");
    return store;
}

/** Buckets a thread into the heading it should appear under in the sidebar. */
function bucketFor(dateish) {
    const date = new Date(dateish);
    if (Number.isNaN(date.getTime())) return "Earlier";

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const daysAgo = Math.floor((startOfToday - date) / 86400000);

    if (daysAgo <= 0) return "Today";
    if (daysAgo === 1) return "Yesterday";
    if (daysAgo < 7) return "Previous 7 days";
    if (daysAgo < 30) return "Previous 30 days";
    return "Earlier";
}

const BUCKET_ORDER = ["Today", "Yesterday", "Previous 7 days", "Previous 30 days", "Earlier"];

/** Groups threads into ordered [bucket, threads] pairs, dropping empty buckets. */
export function groupThreads(threads) {
    const groups = new Map(BUCKET_ORDER.map((name) => [name, []]));
    for (const thread of threads) groups.get(bucketFor(thread.updatedAt)).push(thread);
    return [...groups].filter(([, items]) => items.length);
}

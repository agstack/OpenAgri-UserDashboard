export const clearUserCaches = async (): Promise<void> => {
    if (!('caches' in window)) return;
    const names = await caches.keys();
    await Promise.all(
        names
            .filter(n => n.startsWith('oa-user-'))
            .map(n => caches.delete(n))
    );
};

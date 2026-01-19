export const normalizeTwitchUsername = (username: string | null | undefined) => {
    return (username || "").trim().toLowerCase();
};

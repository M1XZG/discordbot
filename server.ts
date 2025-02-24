import * as console_log from "./utils/logs";
import { discord } from ".";
import { Context, Hono } from "hono";
import { serve } from "@hono/node-server";
import crypto from "crypto";
import { db } from "./db";
import {
    validateBodyConnectionAdd,
    validateBodyConnectionEdit,
    validateBodyConnectionRemove,
} from "./utils/v1-api";
import {
    discordBotTwitch,
    discordBotYoutubeLatest,
    discordBotYoutubeLive,
} from "./db/schema";
import { and, eq } from "drizzle-orm";
//web server
const baseHeaders = {
    "X-Service-Name": "DorasBot",
    "X-Organization-Name": "Doras.to",
    "X-API-Version": "1.0.0",
    "X-Request-ID": crypto.randomUUID(),
    "X-Environment": process.env.NODE_ENV,
};
// Middleware to add headers to every response
const addHeadersMiddleware = async (c: Context, next: () => Promise<void>) => {
    Object.entries(baseHeaders).forEach(([key, value]) => {
        if (value) c.header(key, value);
    });
    await next(); // Ensure the middleware chain continues
};
// Middleware to check Authorization header
const checkAuthorizationMiddleware = async (
    c: Context,
    next: () => Promise<void>
) => {
    const authHeader = c.req.header("Authorization"); // Properly fetch the header
    // Check if the header matches the expected format and API key
    if (authHeader !== `Bearer ${process.env.API_KEY}`) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    await next(); // Ensure the middleware chain continues if authorized
};
const app = new Hono();
app.use("*", addHeadersMiddleware); // Apply middleware to all routes
app.use("*", checkAuthorizationMiddleware); // Apply middleware to all routes
app.get("/", (c) => {
    return c.json({ message: "server is running" });
});
function getRandomAvatarUrl() {
    const randomNumber = Math.floor(Math.random() * 6); // Random number between 0 and 5
    return `https://cdn.discordapp.com/embed/avatars/${randomNumber}.png`;
}
app.post("/api/v1/get_server", async (c) => {
    try {
        const body = await c.req.json();
        const { server_id, user_id } = body;
        if (!server_id) return c.json({ error: "server_id is required" });
        if (!user_id) return c.json({ error: "user_id is required" });
        const discordServer = discord.guilds.cache.get(server_id);
        if (!discordServer) return c.json({ error: "Server not found" });
        const member = await discordServer.members.fetch(user_id);
        if (!member) return c.json({ error: "User not found" });
        if (!member.permissions.has("Administrator"))
            return c.json({ error: "You are not an administrator" });
        return c.json({
            id: discordServer.id,
            name: discordServer.name,
            icon: discordServer.iconURL() || getRandomAvatarUrl(),
            owner_id: discordServer.ownerId,
            member_count: discordServer.memberCount,
            created_at: discordServer.createdAt,
            roles: discordServer.roles.cache.map((role) => ({
                id: role.id,
                name: role.name,
                color: role.hexColor,
                created_at: role.createdAt,
            })),
            channels: discordServer.channels.cache.map((channel) => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
                created_at: channel.createdAt,
            })),
        });
    } catch (error) {
        console_log.error(error);
        return c.json({ error: "Internal Server Error" }, 500);
    }
});
app.post("/api/v1/get_connections", async (c) => {
    try {
        const body = await c.req.json();
        const { server_id, user_id } = body;

        if (!server_id) return c.json({ error: "server_id is required" });
        if (!user_id) return c.json({ error: "user_id is required" });

        const discordServer = discord.guilds.cache.get(server_id);
        if (!discordServer) return c.json({ error: "Server not found" });

        // Helper function to process data and include Discord user info
        const processWithDiscordUser = (items: any) =>
            items.map((item: any) => {
                const discordUser = discordServer.members.cache.get(
                    item.account_id
                );
                return {
                    ...item,
                    discord_user: discordUser
                        ? {
                              id: discordUser.id,
                              username: discordUser.user.username,
                              discriminator: discordUser.user.discriminator,
                              displayName: discordUser.displayName,
                              logo:
                                  discordUser.user.avatarURL() ||
                                  getRandomAvatarUrl(),
                          }
                        : null, // Handle cases where the user is not found in the cache
                };
            });

        // Fetch data from the database
        const twitchLiveStreams = await db.query.discordBotTwitch.findMany({
            where: (table, { eq }) => eq(table.server_id, server_id),
        });

        const youtubeLiveStreams =
            await db.query.discordBotYoutubeLive.findMany({
                where: (table, { eq }) => eq(table.server_id, server_id),
            });

        const youtubeLatest = await db.query.discordBotYoutubeLatest.findMany({
            where: (table, { eq }) => eq(table.server_id, server_id),
        });

        // Apply user processing to all data
        return c.json({
            twitch: processWithDiscordUser(twitchLiveStreams),
            youtube: {
                live: processWithDiscordUser(youtubeLiveStreams),
                latest: processWithDiscordUser(youtubeLatest),
            },
        });
    } catch (error) {
        console.error(error);
        return c.json({ error: "Internal Server Error" }, 500);
    }
});
app.post("/api/v1/connection", async (e) => {
    try {
        const body = await e.req.json();
        const { valid, error, fields } = validateBodyConnectionAdd(body);
        if (!valid) {
            return e.json(
                {
                    status: 400,
                    message: error,
                    fields: fields,
                },
                {
                    status: 400,
                }
            );
        }
        const {
            server_id,
            account_id,
            type,
            channel_id,
            username,
            social_links,
            social_link_url,
            keep_vod,
            message,
        } = body;
        const discordServer = discord.guilds.cache.get(server_id);
        if (!discordServer) return e.json({ error: "Server not found" });
        const channel = discordServer.channels.cache.get(channel_id);
        if (!channel) return e.json({ error: "Channel not found" });
        if (type === "twitch") {
            const dataLiveReq = await fetch(
                process.env.API_SERVER + "/v2/live/twitch/" + username,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            const dataLive = await dataLiveReq.json();
            if (!dataLive?.user?.username) {
                return e.json({
                    status: 400,
                    message: `User ${username} not found on Twitch`,
                });
            }
            const newRow = await db
                .insert(discordBotTwitch)
                .values({
                    id: crypto.randomUUID(),
                    server_id: server_id,
                    account_id: account_id,
                    channel_id: channel_id,
                    username: username,
                    social_links: social_links || false,
                    social_link_url: social_link_url,
                    keep_vod: keep_vod || false,
                    message: message,
                })
                .returning();
            if (newRow.length > 0) {
                return e.json({
                    status: 200,
                    message: "Twitch connection added",
                    data: newRow,
                });
            } else {
                return e.json({
                    status: 500,
                    message: "Error adding Twitch connection",
                });
            }
        }
        if (type === "youtube_live") {
            const dataLiveReq = await fetch(
                process.env.API_SERVER +
                    "/v2/live/youtube/@" +
                    username?.replace("@", ""),
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            const dataLive = await dataLiveReq.json();
            if (!dataLive?.channel?.id) {
                return e.json({
                    status: 400,
                    message: `User ${username?.replace(
                        "@",
                        ""
                    )} not found on Youtube`,
                });
            }
            const newRow = await db
                .insert(discordBotYoutubeLive)
                .values({
                    id: crypto.randomUUID(),
                    server_id: server_id,
                    account_id: account_id,
                    channel_id: channel_id,
                    username: username?.replace("@", ""),
                    social_links: social_links || false,
                    social_link_url: social_link_url,
                    keep_vod: keep_vod || false,
                    message: message,
                })
                .returning();
            if (newRow.length > 0) {
                return e.json({
                    status: 200,
                    message: "Youtube Live connection added",
                    data: newRow,
                });
            } else {
                return e.json({
                    status: 500,
                    message: "Error adding Youtube Live connection",
                });
            }
        }
        if (type === "youtube_latest") {
            const dataLiveReq = await fetch(
                process.env.API_SERVER +
                    "/v2/live/youtube/@" +
                    username?.replace("@", ""),
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            const dataLive = await dataLiveReq.json();
            if (!dataLive?.channel?.id) {
                return e.json({
                    status: 400,
                    message: `User ${username?.replace(
                        "@",
                        ""
                    )} not found on Youtube`,
                });
            }
            const newRow = await db
                .insert(discordBotYoutubeLatest)
                .values({
                    id: crypto.randomUUID(),
                    server_id: server_id,
                    account_id: account_id,
                    channel_id: channel_id,
                    username: username?.replace("@", ""),
                    youtube_id: dataLive.channel?.id,
                    social_links: social_links || false,
                    social_link_url: social_link_url,
                    message: message,
                })
                .returning();
            if (newRow.length > 0) {
                return e.json({
                    status: 200,
                    message: "Youtube Latest connection added",
                    data: newRow,
                });
            } else {
                return e.json({
                    status: 500,
                    message: "Error adding Youtube Latest connection",
                });
            }
        }
        return e.json({
            status: 400,
            message: `Invalid key: 'type'. One of the following is required:`,
            fields: [
                {
                    key: "twitch",
                    type: "string",
                    description: "twitch connection",
                },
                {
                    key: "youtube_live",
                    type: "string",
                    description: "youtube live connection",
                },
                {
                    key: "youtube_latest",
                    type: "string",
                    description: "youtube latest connection",
                },
            ],
        });
    } catch (error) {
        console_log.error(error);
        return e.json({ error: "Internal Server Error" }, 500);
    }
});
app.patch("/api/v1/connection", async (e) => {
    try {
        const body = await e.req.json();
        const { valid, error, fields } = validateBodyConnectionEdit(body);
        if (!valid) {
            return e.json(
                {
                    status: 400,
                    message: error,
                    fields: fields,
                },
                {
                    status: 400,
                }
            );
        }
        const {
            server_id,
            id,
            type,
            channel_id,
            username,
            message,
            social_links,
            social_link_url,
            keep_vod,
        } = body;
        const discordServer = discord.guilds.cache.get(server_id);
        if (!discordServer) return e.json({ error: "Server not found" });
        const channel = discordServer.channels.cache.get(channel_id);
        if (!channel) return e.json({ error: "Channel not found" });
        if (type === "twitch") {
            const dataLiveReq = await fetch(
                process.env.API_SERVER + "/v2/live/twitch/" + username,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            const dataLive = await dataLiveReq.json();
            if (!dataLive?.user?.username) {
                return e.json({
                    status: 400,
                    message: `User ${username} not found on Twitch`,
                });
            }
            const updateRow = await db
                .update(discordBotTwitch)
                .set({
                    channel_id: channel_id,
                    username: username,
                    message: message,
                    social_links: social_links || false,
                    social_link_url: social_link_url,
                    keep_vod: keep_vod || false,
                })
                .where(
                    and(
                        eq(discordBotTwitch.id, id),
                        eq(discordBotTwitch.server_id, server_id)
                    )
                )
                .returning();
            if (updateRow.length > 0) {
                return e.json({
                    status: 200,
                    message: "Twitch connection updated",
                    data: updateRow,
                });
            } else {
                return e.json({
                    status: 500,
                    message: "Error updating Twitch connection",
                });
            }
        }
        if (type === "youtube_live") {
            const dataLiveReq = await fetch(
                process.env.API_SERVER +
                    "/v2/live/youtube/@" +
                    username.replace("@", ""),
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            const dataLive = await dataLiveReq.json();
            if (!dataLive?.channel?.id) {
                return e.json({
                    status: 400,
                    message: `User ${username.replace(
                        "@",
                        ""
                    )} not found on Youtube`,
                });
            }
            const updateRow = await db
                .update(discordBotYoutubeLive)
                .set({
                    channel_id: channel_id,
                    username: username.replace("@", ""),
                    message: message,
                    social_links: social_links || false,
                    social_link_url: social_link_url,
                    keep_vod: keep_vod || false,
                })
                .where(
                    and(
                        eq(discordBotYoutubeLive.id, id),
                        eq(discordBotYoutubeLive.server_id, server_id)
                    )
                )
                .returning();
            if (updateRow.length > 0) {
                return e.json({
                    status: 200,
                    message: "Youtube Live connection updated",
                    data: updateRow,
                });
            } else {
                return e.json({
                    status: 500,
                    message: "Error updating Youtube Live connection",
                });
            }
        }
        if (type === "youtube_latest") {
            const dataLiveReq = await fetch(
                process.env.API_SERVER +
                    "/v2/live/youtube/@" +
                    username.replace("@", ""),
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            const dataLive = await dataLiveReq.json();
            if (!dataLive?.channel?.id) {
                return e.json({
                    status: 400,
                    message: `User ${username.replace(
                        "@",
                        ""
                    )} not found on Youtube`,
                });
            }
            const updateRow = await db
                .update(discordBotYoutubeLatest)
                .set({
                    channel_id: channel_id,
                    username: username.replace("@", ""),
                    youtube_id: dataLive.channel?.id,
                    message: message,
                    social_links: social_links || false,
                    social_link_url: social_link_url,
                })
                .where(
                    and(
                        eq(discordBotYoutubeLatest.id, id),
                        eq(discordBotYoutubeLatest.server_id, server_id)
                    )
                )
                .returning();
            if (updateRow.length > 0) {
                return e.json({
                    status: 200,
                    message: "Youtube Latest connection updated",
                    data: updateRow,
                });
            } else {
                return e.json({
                    status: 500,
                    message: "Error updating Youtube Latest connection",
                });
            }
        }
        return e.json({
            status: 400,
            message: `Invalid key: 'type'. One of the following is required:`,
            fields: [
                {
                    key: "twitch",
                    type: "string",
                    description: "twitch connection",
                },
                {
                    key: "youtube_live",
                    type: "string",
                    description: "youtube live connection",
                },
                {
                    key: "youtube_latest",
                    type: "string",
                    description: "youtube latest connection",
                },
            ],
        });
    } catch (error) {
        console_log.error(error);
        return e.json({ error: "Internal Server Error" }, 500);
    }
});
app.delete("/api/v1/connection", async (e) => {
    try {
        const body = await e.req.json();
        const { valid, error, fields } = validateBodyConnectionRemove(body);
        if (!valid) {
            return e.json(
                {
                    status: 400,
                    message: error,
                    fields: fields,
                },
                {
                    status: 400,
                }
            );
        }
        const { server_id, id, type } = body;
        const discordServer = discord.guilds.cache.get(server_id);
        if (!discordServer) return e.json({ error: "Server not found" });
        if (type === "twitch") {
            const getRow = await db
                .select()
                .from(discordBotTwitch)
                .where(
                    and(
                        eq(discordBotTwitch.id, id),
                        eq(discordBotTwitch.server_id, server_id)
                    )
                );
            if (getRow.length === 0) {
                return e.json({
                    status: 500,
                    message: "Twitch connection not found",
                });
            }
            const deleteRow = await db
                .delete(discordBotTwitch)
                .where(
                    and(
                        eq(discordBotTwitch.id, id),
                        eq(discordBotTwitch.server_id, server_id)
                    )
                );
            if (deleteRow.length === 0) {
                return e.json({
                    status: 200,
                    message: "Twitch connection removed",
                });
            } else {
                return e.json({
                    status: 500,
                    message: "Error removing Twitch connection",
                });
            }
        }
        if (type === "youtube_live") {
            const getRow = await db
                .select()
                .from(discordBotYoutubeLive)
                .where(
                    and(
                        eq(discordBotYoutubeLive.id, id),
                        eq(discordBotYoutubeLive.server_id, server_id)
                    )
                );
            if (getRow.length === 0) {
                return e.json({
                    status: 500,
                    message: "Youtube Live connection not found",
                });
            }
            const deleteRow = await db
                .delete(discordBotYoutubeLive)
                .where(
                    and(
                        eq(discordBotYoutubeLive.id, id),
                        eq(discordBotYoutubeLive.server_id, server_id)
                    )
                );
            if (deleteRow.length === 0) {
                return e.json({
                    status: 200,
                    message: "Youtube Live connection removed",
                });
            } else {
                return e.json({
                    status: 500,
                    message: "Error removing Youtube Live connection",
                });
            }
        }
        if (type === "youtube_latest") {
            const getRow = await db
                .select()
                .from(discordBotYoutubeLatest)
                .where(
                    and(
                        eq(discordBotYoutubeLatest.id, id),
                        eq(discordBotYoutubeLatest.server_id, server_id)
                    )
                );
            if (getRow.length === 0) {
                return e.json({
                    status: 500,
                    message: "Youtube Latest connection not found",
                });
            }
            const deleteRow = await db
                .delete(discordBotYoutubeLatest)
                .where(
                    and(
                        eq(discordBotYoutubeLatest.id, id),
                        eq(discordBotYoutubeLatest.server_id, server_id)
                    )
                );
            if (deleteRow.length === 0) {
                return e.json({
                    status: 200,
                    message: "Youtube Latest connection removed",
                });
            } else {
                return e.json({
                    status: 500,
                    message: "Error removing Youtube Latest connection",
                });
            }
        }
        return e.json({
            status: 400,
            message: `Invalid key: 'type'. One of the following is required:`,
            fields: [
                {
                    key: "twitch",
                    type: "string",
                    description: "twitch connection",
                },
                {
                    key: "youtube_live",
                    type: "string",
                    description: "youtube live connection",
                },
                {
                    key: "youtube_latest",
                    type: "string",
                    description: "youtube latest connection",
                },
            ],
        });
    } catch (error) {
        console_log.error(error);
        return e.json({ error: "Internal Server Error" }, 500);
    }
});
serve({
    fetch: app.fetch,
    port: 5468,
}).on("listening", () => {
    console_log.colour("Server is running on port 5468", "green");
});

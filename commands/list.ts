import {
    ChatInputCommandInteraction,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import { db } from "../db";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
export default {
    data: new SlashCommandBuilder()
        .setName("list")
        .setDescription("List all platform users")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption((option) =>
            option
                .setName("platform")
                .setDescription("Choose the platform")
                .addChoices([
                    { name: "Twitch", value: "twitch" },
                    { name: "YouTube Live", value: "youtube-live" },
                    { name: "YouTube Latest", value: "youtube-latest" },
                    { name: "Youtube Short", value: "youtube-short-latest" },
                ])
                .setRequired(true)
        ),
    async execute(inter: ChatInputCommandInteraction) {
        try {
            await inter.deferReply({
                ephemeral: true,
            });
            if (!inter.guildId) {
                await inter.editReply({
                    content: "This command can only be used in a server",
                });
                return;
            }
            const platform = inter.options.getString("platform");
            if (platform === "twitch") {
                const users = await db
                    .select()
                    .from(schema.discordBotTwitch)
                    .where(
                        eq(schema.discordBotTwitch.server_id, inter.guildId)
                    );
                if (users.length === 0) {
                    await inter.editReply({
                        content: "No users found",
                    });
                    return;
                }
                const embeds = [];
                const chunkSize = 25;
                for (let i = 0; i < users.length; i += chunkSize) {
                    const chunk = users.slice(i, i + chunkSize);
                    let embed: any = {
                        color: parseInt("a970ff", 16),
                        title: "List of Twitch users",
                        fields: chunk.map((user) => ({
                            name: `${user.username} added by`,
                            value: `<@${user.account_id}> used in <#${user.channel_id}>`,
                        })),
                        thumbnail: {
                            url: "https://cdn3.iconfinder.com/data/icons/popular-services-brands-vol-2/512/twitch-512.png",
                        },
                    };
                    i == 0
                        ? (embed.description = `Total Twitch accounts: ${users.length}`)
                        : "",
                        embeds.push(embed);
                }
                if (embeds.length === 0) {
                    await inter.editReply({
                        content: "No users found",
                    });
                    return;
                }
                await inter.editReply({
                    embeds: embeds.slice(0, 10),
                });
                return;
            }
            if (platform === "youtube-live") {
                const users = await db
                    .select()
                    .from(schema.discordBotYoutubeLive)
                    .where(
                        eq(
                            schema.discordBotYoutubeLive.server_id,
                            inter.guildId
                        )
                    );
                if (users.length === 0) {
                    await inter.editReply({
                        content: "No users found",
                    });
                    return;
                }
                const embeds = [];
                const chunkSize = 25;
                for (let i = 0; i < users.length; i += chunkSize) {
                    const chunk = users.slice(i, i + chunkSize);
                    let embed: any = {
                        color: parseInt("ff0033", 16),
                        title: "List of YouTube live users",
                        fields: chunk.map((user) => ({
                            name: `@${user.username} added by`,
                            value: `<@${user.account_id}> used in <#${user.channel_id}>`,
                        })),
                        thumbnail: {
                            url: "https://cdn1.iconfinder.com/data/icons/logotypes/32/youtube-512.png",
                        },
                    };
                    i == 0
                        ? (embed.description = `Total YouTube accounts: ${users.length}`)
                        : "",
                        embeds.push(embed);
                }
                if (embeds.length === 0) {
                    await inter.editReply({
                        content: "No users found",
                    });
                    return;
                }
                await inter.editReply({
                    embeds: embeds.slice(0, 10),
                });
                return;
            }
            if (platform === "youtube-latest") {
                const users = await db
                    .select()
                    .from(schema.discordBotYoutubeLatest)
                    .where(
                        eq(
                            schema.discordBotYoutubeLatest.server_id,
                            inter.guildId
                        )
                    );
                if (users.length === 0) {
                    await inter.editReply({
                        content: "No users found",
                    });
                    return;
                }
                const embeds = [];
                const chunkSize = 25;
                for (let i = 0; i < users.length; i += chunkSize) {
                    const chunk = users.slice(i, i + chunkSize);
                    let embed: any = {
                        color: parseInt("ff0033", 16),
                        title: "List of YouTube latest users",
                        fields: chunk.map((user) => ({
                            name: `@${user.username} added by`,
                            value: `<@${user.account_id}> used in <#${user.channel_id}>`,
                        })),
                        thumbnail: {
                            url: "https://cdn1.iconfinder.com/data/icons/logotypes/32/youtube-512.png",
                        },
                    };
                    i == 0
                        ? (embed.description = `Total YouTube accounts: ${users.length}`)
                        : "",
                        embeds.push(embed);
                }
                if (embeds.length === 0) {
                    await inter.editReply({
                        content: "No users found",
                    });
                    return;
                }
                await inter.editReply({
                    embeds: embeds.slice(0, 10),
                });
                return;
            }
            if (platform === "youtube-short-latest") {
                const users = await db
                    .select()
                    .from(schema.discordBotYoutubeLatestShort)
                    .where(
                        eq(
                            schema.discordBotYoutubeLatestShort.server_id,
                            inter.guildId
                        )
                    );
                if (users.length === 0) {
                    await inter.editReply({
                        content: "No users found",
                    });
                    return;
                }
                const embeds = [];
                const chunkSize = 25;
                for (let i = 0; i < users.length; i += chunkSize) {
                    const chunk = users.slice(i, i + chunkSize);
                    let embed: any = {
                        color: parseInt("ff0033", 16),
                        title: "List of YouTube latest short users",
                        fields: chunk.map((user) => ({
                            name: `@${user.username} added by`,
                            value: `<@${user.account_id}> used in <#${user.channel_id}>`,
                        })),
                        thumbnail: {
                            url: "https://cdn1.iconfinder.com/data/icons/logotypes/32/youtube-512.png",
                        },
                    };
                    i == 0
                        ? (embed.description = `Total YouTube short accounts: ${users.length}`)
                        : "",
                        embeds.push(embed);
                }
                if (embeds.length === 0) {
                    await inter.editReply({
                        content: "No users found",
                    });
                    return;
                }
                await inter.editReply({
                    embeds: embeds.slice(0, 10),
                });
                return;
            }
        } catch (error) {
            console.error("Error executing list command: ", error);
            await inter.editReply({
                content: "There was an error executing the command.",
            });
        }
    },
};

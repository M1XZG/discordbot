import { ChatInputCommandInteraction, Events, Interaction } from "discord.js";
import {
    AddButtonDataTwitch,
    AddButtonDataYoutubeLatest,
    AddButtonDataYoutubeLatestShort,
    AddButtonDataYoutubeLive,
    commands,
    discord,
} from "..";
import { db } from "../db";
import * as schema from "../db/schema";
import { randomUUID } from "crypto";
discord.on(
    Events.InteractionCreate,
    async (interaction: Interaction): Promise<any> => {
        if (interaction.isButton()) {
            // Handle button interaction here
            try {
                switch (interaction.customId) {
                    case "accept-twitch":
                        const data = AddButtonDataTwitch.get(
                            interaction.message.id
                        );
                        if (!data) {
                            await interaction.reply({
                                content: "Button pressed but no data found.",
                                ephemeral: true,
                            });
                            AddButtonDataTwitch.delete(interaction.message.id);
                            return;
                        }
                        const dataDB = await db
                            .insert(schema.discordBotTwitch)
                            .values({
                                id: randomUUID(),
                                account_id: interaction.user.id,
                                channel_id: data?.channel || "",
                                server_id: data.server || "",
                                username: data.username || "",
                                message_id: null,
                                social_links: false,
                                keep_vod: data.keep_vod || false,
                                mention: data.mention || null,
                                message: data.message || null,
                            })
                            .returning();
                        if (!dataDB) {
                            await interaction.reply({
                                content:
                                    "There was an error executing the command.",
                                ephemeral: true,
                            });
                            AddButtonDataTwitch.delete(interaction.message.id);
                            return;
                        } else {
                            await interaction.reply({
                                content: `${data.username} has been added to the database.`,
                                ephemeral: true,
                            });
                            AddButtonDataTwitch.delete(interaction.message.id);
                        }
                        break;
                    case "reject-twitch":
                        AddButtonDataTwitch.delete(interaction.message.id);
                        await interaction.reply({
                            content: "User has rejected",
                            ephemeral: true,
                        });
                        break;
                    case "accept-youtube-live":
                        const dataYT = AddButtonDataYoutubeLive.get(
                            interaction.message.id
                        );
                        if (!dataYT) {
                            await interaction.reply({
                                content: "Button pressed but no data found.",
                                ephemeral: true,
                            });
                            AddButtonDataYoutubeLive.delete(
                                interaction.message.id
                            );
                            return;
                        }
                        const dataDBYT = await db
                            .insert(schema.discordBotYoutubeLive)
                            .values({
                                id: randomUUID(),
                                account_id: interaction.user.id,
                                channel_id: dataYT?.channel || "",
                                server_id: dataYT.server || "",
                                username: dataYT.username || "",
                                message_id: null,
                                social_links: false,
                                keep_vod: dataYT.keep_vod || false,
                                message: dataYT.message || null,
                            })
                            .returning();
                        if (!dataDBYT) {
                            await interaction.reply({
                                content:
                                    "There was an error executing the command.",
                                ephemeral: true,
                            });
                            AddButtonDataYoutubeLive.delete(
                                interaction.message.id
                            );
                            return;
                        } else {
                            await interaction.reply({
                                content: `${dataYT.username} has been added to the database.`,
                                ephemeral: true,
                            });
                            AddButtonDataYoutubeLive.delete(
                                interaction.message.id
                            );
                        }
                        break;
                    case "reject-youtube-live":
                        AddButtonDataYoutubeLive.delete(interaction.message.id);
                        await interaction.reply({
                            content: "User has rejected",
                            ephemeral: true,
                        });
                        break;
                    case "accept-youtube-latest":
                        const dataYTLatest = AddButtonDataYoutubeLatest.get(
                            interaction.message.id
                        );
                        if (!dataYTLatest) {
                            await interaction.reply({
                                content: "Button pressed but no data found.",
                                ephemeral: true,
                            });
                            AddButtonDataYoutubeLatest.delete(
                                interaction.message.id
                            );
                            return;
                        }
                        const dataDBYTLatest = await db
                            .insert(schema.discordBotYoutubeLatest)
                            .values({
                                id: randomUUID(),
                                account_id: interaction.user.id,
                                channel_id: dataYTLatest?.channel || "",
                                server_id: dataYTLatest.server || "",
                                username: dataYTLatest.username || "",
                                youtube_id: dataYTLatest.youtube_id || "",
                                social_links: false,
                                message: dataYTLatest.message || null,
                            })
                            .returning();
                        if (!dataDBYTLatest) {
                            await interaction.reply({
                                content:
                                    "There was an error executing the command.",
                                ephemeral: true,
                            });
                            AddButtonDataYoutubeLatest.delete(
                                interaction.message.id
                            );
                            return;
                        } else {
                            await interaction.reply({
                                content: `${dataYTLatest.username} has been added to the database.`,
                                ephemeral: true,
                            });
                            AddButtonDataYoutubeLatest.delete(
                                interaction.message.id
                            );
                        }
                        break;
                    case "reject-youtube-latest":
                        AddButtonDataYoutubeLatest.delete(
                            interaction.message.id
                        );
                        await interaction.reply({
                            content: "User has rejected",
                            ephemeral: true,
                        });
                        break;
                    case "accept-youtube-latest-short":
                        const dataYTLatestShort =
                            AddButtonDataYoutubeLatestShort.get(
                                interaction.message.id
                            );
                        if (!dataYTLatestShort) {
                            await interaction.reply({
                                content: "Button pressed but no data found.",
                                ephemeral: true,
                            });
                            AddButtonDataYoutubeLatestShort.delete(
                                interaction.message.id
                            );
                            return;
                        }
                        const dataDBYTLatestShort = await db
                            .insert(schema.discordBotYoutubeLatestShort)
                            .values({
                                id: randomUUID(),
                                account_id: interaction.user.id,
                                channel_id: dataYTLatestShort?.channel || "",
                                server_id: dataYTLatestShort.server || "",
                                username: dataYTLatestShort.username || "",
                                youtube_id: dataYTLatestShort.youtube_id || "",
                                social_links: false,
                                message: dataYTLatestShort.message || null,
                            })
                            .returning();
                        if (!dataDBYTLatestShort) {
                            await interaction.reply({
                                content:
                                    "There was an error executing the command.",
                                ephemeral: true,
                            });
                            AddButtonDataYoutubeLatestShort.delete(
                                interaction.message.id
                            );
                            return;
                        } else {
                            await interaction.reply({
                                content: `${dataYTLatestShort.username} has been added to the database.`,
                                ephemeral: true,
                            });
                            AddButtonDataYoutubeLatestShort.delete(
                                interaction.message.id
                            );
                        }
                        break;
                    case "reject-youtube-latest":
                        AddButtonDataYoutubeLatestShort.delete(
                            interaction.message.id
                        );
                        await interaction.reply({
                            content: "User has rejected",
                            ephemeral: true,
                        });
                        break;
                    default:
                        await interaction.reply({
                            content: "Button pressed!",
                            ephemeral: true,
                        });
                        setTimeout(() => {
                            interaction.deleteReply().catch(console.error);
                        }, 2500);
                        break;
                }
            } catch (error: any) {
                console.error(error);
                interaction
                    .reply({
                        content:
                            "There was an error handling the button interaction.",
                        ephemeral: true,
                    })
                    .catch(console.error);
            }
            return;
        }
        if (!interaction.isChatInputCommand()) return;

        const command = commands.get(interaction.commandName);

        if (!command) return;
        try {
            command.execute(interaction as ChatInputCommandInteraction);
        } catch (error: any) {
            console.error(error);
            if (error.message.includes("permissions")) {
                interaction
                    .reply({ content: error.toString(), ephemeral: true })
                    .catch(console.error);
            } else {
                interaction
                    .reply({
                        content: "There was an error executing that command.",
                        ephemeral: true,
                    })
                    .catch(console.error);
            }
        }
    }
);

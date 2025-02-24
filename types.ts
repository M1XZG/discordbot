import {
    discordBotTwitch,
    discordBotYoutubeLatest,
    discordBotYoutubeLive,
} from "./db/schema";

export type ITwitch = typeof discordBotTwitch.$inferInsert;
export type IYoutubeLive = typeof discordBotYoutubeLive.$inferInsert;
export type IYoutubeLatest = typeof discordBotYoutubeLatest.$inferInsert;

import {
    ChatInputCommandInteraction,
    PermissionsBitField,
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("authenticate")
        .setDescription("Connect your Doras account")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    cooldown: 3,
    async execute(inter: ChatInputCommandInteraction) {
        try {
            await inter.deferReply({
                ephemeral: true,
            });

            if (!inter.guildId) {
                await inter.editReply({
                    content: "This command can only be used in a server.",
                });
                return;
            }

            // Authentication Link
            const authUrl = process.env.SERVER_URL + "/auth/login";

            // Create Embed
            const embed = new EmbedBuilder()
                .setTitle("Authenticate")
                .setDescription(
                    "Click the button below to authenticate your Doras account."
                );

            // Create Button
            const authButton = new ButtonBuilder()
                .setLabel("Connect Your Account")
                .setURL(authUrl)
                .setStyle(ButtonStyle.Link); // ButtonStyle.Link makes it a clickable link

            // Send Embed and Button
            await inter.editReply({
                embeds: [embed],
                components: [
                    {
                        type: 1, // Action Row
                        components: [authButton],
                    },
                ],
            });
            return;
        } catch (error) {
            console.error("Error executing authenticate command:", error);
            await inter.editReply({
                content: "There was an error executing the command.",
            });
        }
    },
};

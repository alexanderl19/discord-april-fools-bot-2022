import {
  ApplicationCommandTypes,
  InteractionResponseTypes,
  transformEmbed,
} from "../../deps.ts";
import { validatePermissions } from "https://deno.land/x/discordeno@13.0.0-rc34/plugins/permissions/mod.ts";
import { createCommand } from "./mod.ts";

import { Image } from "https://deno.land/x/imagescript@v1.2.12/mod.ts";
import { toBase64 } from "https://deno.land/x/fast_base64@v0.1.7/mod.ts";

createCommand({
  name: "aprilfools",
  description: "Adds a notification icon to your server's image!",
  type: ApplicationCommandTypes.ChatInput,
  scope: "Global",
  execute: async (bot, interaction) => {
    const memberPermissions = interaction.member?.permissions;

    if (!memberPermissions)
      return bot.helpers.sendInteractionResponse(
        interaction.id,
        interaction.token,
        {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: "Could not determine your permissions. Please try again.",
          },
        }
      );

    if (!validatePermissions(memberPermissions, ["MANAGE_GUILD"]))
      return bot.helpers.sendInteractionResponse(
        interaction.id,
        interaction.token,
        {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content:
              'You don\'t have enough permissions. Please ensure you have the "Manage Server" or "Administrator" permissions.',
          },
        }
      );

    const guildId = interaction.guildId;

    if (!guildId)
      return bot.helpers.sendInteractionResponse(
        interaction.id,
        interaction.token,
        {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: "Could not retrieve server. Please try again.",
          },
        }
      );

    const guild = await bot.helpers.getGuild(guildId);
    const iconID = guild.icon;

    if (!iconID)
      return bot.helpers.sendInteractionResponse(
        interaction.id,
        interaction.token,
        {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content:
              "Could not retrieve server image. This is likely due to your server not having one. Please add one and try again.",
          },
        }
      );

    const iconURL = bot.helpers.guildIconURL(guildId, iconID, {
      size: 2048,
      format: "png",
    });

    if (!iconURL)
      return bot.helpers.sendInteractionResponse(
        interaction.id,
        interaction.token,
        {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: "Could not retrieve icon URL. Please try again.",
          },
        }
      );

    const icon = await fetch(iconURL);
    const overlay = await Image.decode(await Deno.readFile("./overlay.png"));
    const image = await Image.decode(await icon.arrayBuffer());
    image.resize(2048, 2048);
    image.drawCircle(
      1165 - (8 / 48) * 2048,
      1165 + (8 / 48) * 2048,
      (12 / 48) * 2048,
      Image.rgbaToColor(0, 0, 0, 0)
    );
    image.composite(overlay, 0, 0);

    const newGuildIcon = await image.encode();

    const base64 = await toBase64(newGuildIcon);

    bot.helpers.editGuild(
      guildId,
      { icon: `data:image/png;base64,${base64}` },
      guild.shardId
    );

    await bot.helpers.sendInteractionResponse(
      interaction.id,
      interaction.token,
      {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          embeds: [
            transformEmbed(bot, {
              // TODO: Get bot info automatically
              author: {
                icon_url:
                  "https://cdn.discordapp.com/avatars/959337791999856651/36aa6c7f9cc26bcb31a2095e6c476db3.webp?size=128",
                name: "Server Badges",
              },
              title: "Notification Badge Added!",
              description:
                "Happy April Fools!\n\n[Add this bot to your server](https://discord.com/api/oauth2/authorize?client_id=959337791999856651&permissions=32&scope=bot%20applications.commands)",
            }),
          ],
        },
      }
    );
  },
});

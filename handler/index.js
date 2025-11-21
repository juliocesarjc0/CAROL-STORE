const fs = require("fs");
const path = require("path");

module.exports = async (client) => {
  const SlashsArray = [];
  const commandsFolder = path.join(__dirname, "../commands");

  fs.readdir(commandsFolder, (error, folders) => {
    if (error) {
      console.error("❌ Erro ao ler pasta de comandos:", error);
      return;
    }

    folders.forEach((subfolder) => {
      const subfolderPath = path.join(commandsFolder, subfolder);

      fs.readdir(subfolderPath, (error, files) => {
        if (error) {
          console.error(`❌ Erro ao ler subpasta ${subfolder}:`, error);
          return;
        }

        files.forEach((file) => {
          if (!file?.endsWith(".js")) return;

          const filePath = path.join(subfolderPath, file);
          const command = require(filePath);

          if (!command?.name) return;

          client.slashCommands.set(command?.name, command);
          SlashsArray.push(command);
        });
      });
    });
  });

  client.on("clientReady", async () => {
    client.guilds.cache.forEach((guild) => guild.commands.set(SlashsArray));
    console.log(`✅ ${SlashsArray.length} comandos registrados!`);
  });

  client.on("guildCreate", async (guild) => {
    guild.commands.set(SlashsArray);
  });
};
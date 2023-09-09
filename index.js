const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, Routes, REST} = require("discord.js");
const { token, clientId, guildId } = require("./config.json");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [];

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const folder of commandFolders) { // Skenuje pro commandy v složce commands
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
            client.commands.set(command.data.name, command);
			console.log(`Added command ${command.data.name} from path ${filePath}`)
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const rest = new REST().setToken(token); // Nastaví token pro endpointy asi

(async () => { //Registrace příkazů
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

client.on(Events.InteractionCreate, async interaction => { // Handling příkazů
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
	//console.log(interaction);
});

client.once(Events.ClientReady, c => {
	// Kód zde je on ready
	console.log(`Ready! Logged in as ${c.user.tag}`);
});



/*const guild = client.guilds.cache.get(guildId);
const data = rest.put(
	Routes.applicationCommands(clientId),
	{ body: null },
);*/ // Clears guild specific commands
client.login(token) // Logins with token
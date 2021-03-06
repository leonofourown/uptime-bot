require("express")().listen(1343);

const db = require("quick.db");
const discord = require("discord.js");
const client = new discord.Client({ disableEveryone: true });
client.login("ADD-BOT-TOKEN-HERE");     //TOKEN HERE 
const fetch = require("node-fetch");
const fs = require("fs");

setInterval(() => {
  var links = db.get("links");
  if (!links) return;
  var linkA = links.map(c => c.url);
  linkA.forEach(link => {
    try {
      fetch(link);
    } catch (e) {
      console.log("" + e);
    }
  });
  console.log("Pong! Requests sent");
}, 60000);

client.on("ready", () => {
  if (!Array.isArray(db.get("links"))) {
    db.set("links", []);
  }
});

client.on("message", message => {
  if (message.author.bot) return;
  var spl = message.content.split(" ");
  if (spl[0] == ".add") {
    var link = spl[1];
    fetch(link)
      .then(() => {
        if (
          db
            .get("links")
            .map(z => z.url)
            .includes(link)
        )
          return message.channel.send("already have");
        message.channel.send("added");
        db.push("links", { url: link, owner: message.author.id });
      })
      .catch(e => {
        return message.channel.send("error: " + e);
      });
  }
});

client.on("message", async message => {
  if (!message.content.startsWith(".eval")) return;
  if (!["OWNER-ID-HERE",""].includes(message.author.id))     //OWNER ID HERE
    return;
  var args = message.content.split(".eval")[1];
  if (!args) return message.channel.send(":warning: | CODE?");

  const code = args;

  function clean(text) {
    if (typeof text !== "string")
      text = require("util").inspect(text, { depth: 3 });
    text = text
      .replace(/`/g, "`" + String.fromCharCode(8203))
      .replace(/@/g, "@" + String.fromCharCode(8203));
    return text;
  }

  var evalEmbed = "";
  try {
    var evaled = await clean(await eval(await code));
    if (evaled.constructor.name === "Promise")
      evalEmbed = `\`\`\`\n${evaled}\n\`\`\``;
    else evalEmbed = `\`\`\`js\n${evaled}\n\`\`\``;

    if (evaled.length < 1900) {
      message.channel.send(`\`\`\`js\n${evaled}\`\`\``);
    } else {
      var hast = await require("hastebin-gen")(evaled, {
        url: "https://hasteb.in"
      });
      message.channel.send(hast);
    }
  } catch (err) {
    message.channel.send(`\`\`\`js\n${err}\n\`\`\``);
  }
});




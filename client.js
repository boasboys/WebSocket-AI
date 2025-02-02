#!/usr/bin/env node

const WebSocket = require("ws");
const readline = require("readline");
const kleur = require("kleur"); // For terminal colors
const { createSpinner } = require("nanospinner"); // For spinners
const figlet = require("figlet");
const dotenv = require("dotenv");
dotenv.config();

if (!process.env.API_KEY || !process.env.PORT || !process.env.PASSWORD) {
  console.error("Missing required environment variables in .env file.");
  process.exit(1);
}

const SERVER_URL = `ws://localhost:${process.env.PORT}`;
const PASSWORD = process.env.PASSWORD;

// Password prompt function with secure input
function askForPassword() {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error("Password prompt requires a TTY terminal."));
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let password = "";
    console.log(kleur.yellow("Enter password: "));

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on("keypress", (char, key) => {
      if (key && key.name === "return") {
        process.stdin.setRawMode(false);
        process.stdin.removeAllListeners("keypress");
        rl.close();
        console.log();
        resolve(password.trim());
      } else if (key && key.name === "backspace") {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(kleur.yellow("Enter password: ") + "*".repeat(password.length));
        }
      } else {
        password += char;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(kleur.yellow("Enter password: ") + "*".repeat(password.length));
      }
    });
  });
}

// Display ASCII banner
function showBanner() {
  console.log(
    kleur.green(
      figlet.textSync("WebSocket AI", {
        font: "ANSI Shadow",
        horizontalLayout: "default",
        verticalLayout: "default",
        width: 90,
        whitespaceBreak: true,
      })
    )
  );
  console.log(kleur.white("A Command Line Tool to Interact with AI.\n"));
  console.log(kleur.white("Type your question and press Enter to talk to the AI."));
  console.log(kleur.white("Type 'exit' to quit.\n"));
}

// Simulate connection initialization
async function simulateScan() {
  const spinner = createSpinner("Initializing connection...").start();
  await new Promise((resolve) => setTimeout(resolve, 1500));
  spinner.update({ text: "Authenticating..." });
  await new Promise((resolve) => setTimeout(resolve, 1500));
  spinner.update({ text: "Establishing secure connection..." });
  await new Promise((resolve) => setTimeout(resolve, 1500));
  spinner.success({ text: "Connection established!" });
}

// Typewriter effect for AI responses
function typeWriterEffect(text, delay = 50) {
  return new Promise((resolve) => {
    let i = 0;
    const interval = setInterval(() => {
      process.stdout.write(kleur.green(text[i]));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        process.stdout.write("\n");
        resolve();
      }
    }, delay);
  });
}

// Main logic
(async function main() {
  const password = await askForPassword();
  if (password !== PASSWORD) {
    console.log(kleur.red("\nIncorrect password. Exiting..."));
    process.exit(1);
  }

  console.log(kleur.green("\nAccess granted.\n"));
  const socket = new WebSocket(SERVER_URL);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: kleur.green("You> "),
  });

  socket.on("open", async () => {
    console.log(kleur.green(`[Client] Connected to server: ${SERVER_URL}`));
    showBanner();
    await simulateScan();
    rl.prompt();
  });

  socket.on("message", async (data) => {
    const decodedMessage = data.toString();
    

    const spinner = createSpinner("AI is typing...").start();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    spinner.stop();

    console.log(kleur.blue("AI> ") + kleur.green(decodedMessage));
    rl.prompt();
  });

  socket.on("error", (error) => {
    console.error(kleur.red(`[Client] WebSocket error: ${error.message}`));
    rl.close();
  });

  socket.on("close", () => {
    console.log(kleur.red("[Client] Disconnected from server."));
    rl.close();
  });

  rl.on("line", (line) => {
    const message = line.trim();
    if (message.toLowerCase() === "exit") {
      console.log(kleur.red("Goodbye!"));
      socket.close();
      rl.close();
      return;
    }

    console.log("You: " + kleur.yellow(message));
    socket.send(message);
    rl.prompt();
  });

  rl.on("close", () => {
    console.log(kleur.red("Connection closed."));
    process.exit(0);
  });
})();
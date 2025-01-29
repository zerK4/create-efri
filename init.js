#!/usr/bin/env bun

import { join } from "path";
import { spawnSync } from "child_process";
import { writeFile, readFile } from "fs/promises";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { $ } from "bun";

async function mascotSays(message) {
  console.log(`${chalk.bold.cyan("🦉 EFRI:")} ${chalk.cyan(message)}`);
}

async function fetchJoke() {
  try {
    const response = await fetch(
      "https://official-joke-api.appspot.com/jokes/programming/random"
    );
    const jokes = await response.json();
    return jokes[0]
      ? `${jokes[0].setup}\n${jokes[0].punchline}`
      : "No joke found, but keep coding!";
  } catch {
    return "Oops! Couldn't fetch a joke this time. Try again later!";
  }
}

async function init() {
  await mascotSays(
    "Hi there! I'm EFRI, your friendly guide. Let's set up your project! 🦉✨"
  );
  const projectName = process.argv[2] || "my-efri-app";
  const projectPath = join(process.cwd(), projectName);

  await mascotSays(
    `Creating a new project in ${chalk.underline(projectPath)}...\n`
  );
  const spinner = ora("Setting up project...").start();

  const cloneProcess = spawnSync(
    "git",
    [
      "clone",
      "--depth=1",
      "https://github.com/zerK4/efri-starter.git",
      projectPath,
    ],
    { stdio: "ignore" }
  );
  if (cloneProcess.status !== 0) {
    spinner.fail(chalk.red.bold("❌ Failed to set up the project."));
    await mascotSays(
      "Oh no! Something went wrong while setting up the project. 😢"
    );
    process.exit(1);
  }

  spawnSync("rm", ["-rf", ".git"], { cwd: projectPath });
  spinner.succeed(chalk.green.bold("✅ Project structure created."));
  await mascotSays("Great! The project structure is ready. 🎉 \n");

  const { database } = await inquirer.prompt([
    {
      type: "list",
      name: "database",
      message: "Which database do you prefer?",
      choices: ["sqlite", "mysql", "postgresql"],
      default: "sqlite",
    },
  ]);
  await mascotSays(`You chose ${chalk.bold(database)}. Nice choice! 🛠️`);

  const envExamplePath = join(projectPath, ".env.example");
  const envPath = join(projectPath, ".env");
  try {
    const envExampleContent = await readFile(envExamplePath, "utf8");
    const updatedEnvContent = envExampleContent.replace(
      /^DATABASE=.*$/m,
      `DATABASE=${database}`
    );
    await writeFile(envPath, updatedEnvContent);
    await mascotSays("✅ Created the .env file. Your database is all set!");
  } catch (error) {
    await mascotSays(
      `❌ Oops! I couldn't create the .env file. Here's the error: ${error}`
    );
    process.exit(1);
  }

  const { installDeps } = await inquirer.prompt([
    {
      type: "confirm",
      name: "installDeps",
      message: "Do you want to install dependencies?",
      default: true,
    },
  ]);
  if (installDeps) {
    const installSpinner = ora("Installing dependencies...").start();
    const installProcess = spawnSync("bun", ["install"], {
      cwd: projectPath,
      stdio: "ignore",
      shell: true,
    });

    if (installProcess.status !== 0) {
      installSpinner.fail(chalk.red.bold("❌ Dependency installation failed."));
      await mascotSays("Oh no! Installing dependencies failed. 😢");
      process.exit(1);
    }
    installSpinner.succeed(
      chalk.green.bold("✅ Dependencies installed successfully.")
    );
    await mascotSays("All dependencies are installed and ready to go! 🚀 \n");
  } else {
    await mascotSays("No problem! You can install dependencies later. 😊");
  }

  const { initGit } = await inquirer.prompt([
    {
      type: "confirm",
      name: "initGit",
      message: "Do you want to initialize a new git repository?",
      default: true,
    },
  ]);
  if (initGit) {
    const gitSpinner = ora("Initializing git repository...").start();
    const gitInitProcess = spawnSync("git", ["init"], {
      cwd: projectPath,
      stdio: "ignore",
    });

    if (gitInitProcess.status !== 0) {
      gitSpinner.fail(
        chalk.red.bold("❌ Failed to initialize git repository.")
      );
      await mascotSays("Hmm, something went wrong with initializing Git. 😕");
      process.exit(1);
    }
    gitSpinner.succeed(chalk.green.bold("✅ Git repository initialized."));
    await mascotSays(
      "Git repository is ready! You're all set to start coding. 🎉"
    );
  }

  await mascotSays(
    "✨ Project setup complete! Here's what to do next:\n\n1. Navigate to your project:\n   " +
      chalk.cyan(`cd ${projectName}`) +
      "\n\n2. Start the project:\n   " +
      chalk.cyan("bun start") +
      "\n\nHappy coding! 🦉✨"
  );

  const { wantJoke } = await inquirer.prompt([
    {
      type: "confirm",
      name: "wantJoke",
      message: "Do you want to hear a developer joke?",
      default: true,
    },
  ]);
  if (wantJoke) {
    const joke = await fetchJoke();
    await mascotSays(`🤣 ${joke}`);
  }
}

init().catch(async (err) => {
  await mascotSays(`❌ Oh no! Something went wrong during setup: ${err}`);
  process.exit(1);
});

import * as fs from "fs/promises";
import * as core from "@actions/core";
import * as artifacts from "@actions/artifact";

const ROOT_DIRECTORY = "./tmp/variables";

const getFilePath = (name: string) => `${ROOT_DIRECTORY}/${name}.txt`;

const setVariable = async (name: string, value: string): Promise<void> => {
  const client = artifacts.create();
  const filePath = getFilePath(name);

  // Make root directory and create file.
  await fs.mkdir(ROOT_DIRECTORY, { recursive: true });
  await fs.appendFile(filePath, value);

  // Upload file as artifact.
  await client.uploadArtifact(name, [filePath], ROOT_DIRECTORY);
  core.info(`Set variable ${name} successfully.`);
};

const getVariable = async (name: string): Promise<void> => {
  const client = artifacts.create();
  const filePath = getFilePath(name);

  // Download file and set permissions.
  await fs.mkdir(ROOT_DIRECTORY, { recursive: true });
  await client.downloadArtifact(name, ROOT_DIRECTORY);
  await fs.chmod(filePath, "0777");

  // Read file and set output.
  const file = await fs.readFile(filePath);
  core.setOutput("value", file.toString());
  core.info(`Got variable ${name} successfully.`);
};

const run = async (): Promise<void> => {
  const mode = core.getInput("mode", { required: true });
  const name = core.getInput("name", { required: true });
  const value = core.getInput("value", { required: mode === "set" });
  const wait = core.getInput("wait", { required: false });
  const waitRetries = core.getInput("wait_retries", { required: false });

  if (mode === "set") await setVariable(name, value);
  if (mode === "get" && wait !== "true") await getVariable(name);

  if (mode === "get" && wait === "true") {
    const maxRetries = waitRetries || 10;
    let count = 0;

    const interval = setInterval(() => {
      if (count > maxRetries) {
        clearInterval(interval);
        core.setFailed(`${value} still not set after ${maxRetries} tries.`);
      }

      try {
        getVariable(name);
        clearInterval(interval);
      } catch (error) {
        count += 1;
        core.info(
          `Waiting for ${name} to be set... (attempt ${count} / ${maxRetries})`
        );
      }
    }, 1000);
  }
};

run();

import * as fs from 'fs/promises';
import * as core from "@actions/core";
import * as artifacts from "@actions/artifact";

const ROOT_DIRECTORY = './tmp/variables';

const getFilePath = (name: string) => `${ROOT_DIRECTORY}/${name}.txt`;


const setVariable = async (name: string, value: string): Promise<void> => {
  const client = artifacts.create();
  const filePath = getFilePath(name);
  await fs.mkdir(ROOT_DIRECTORY, { recursive: true });
  await fs.appendFile(filePath, value);
  await client.uploadArtifact(name, [filePath], ROOT_DIRECTORY);
  core.info(`Set variable ${name} successfully.`);
};

const getVariable = async (name: string): Promise<void> => {
  const client = artifacts.create();
  const filePath = getFilePath(name);

  // Download file and set permissions.
  await fs.mkdir(ROOT_DIRECTORY, { recursive: true });
  await client.downloadArtifact(name, ROOT_DIRECTORY);
  await fs.chmod(filePath, '0777');

  await fs.readdir(ROOT_DIRECTORY).then((files) => files.map(core.info));

  // Read file and set output.
  const file = await fs.readFile(filePath);
  core.setOutput('value', file.toString());
  core.info(`Got variable ${name} successfully.`);
};

const run = async (): Promise<void> => {
  const mode = core.getInput('mode', { required: true });
  const name = core.getInput('name', { required: true })
  const value = core.getInput('value', { required: mode === 'set' })

  if (mode === 'set') await setVariable(name, value);
  if (mode === 'get') await getVariable(name);
};

run();

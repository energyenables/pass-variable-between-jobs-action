import * as core from "@actions/core";
import * as artifacts from "@actions/artifact";

const run = async (): Promise<void> => {
  const name = core.getInput("name", { required: true });
  const path = core.getInput("path", { required: true });

  const client = artifacts.create();
};

run();

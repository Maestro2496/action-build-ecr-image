const core = require("@actions/core");
const github = require("@actions/github");
const {
  buildImage,
  tagImage,
  pushImage,
  loginToECR,
  getRegistryId,
} = require("./command");

const run = async () => {
  try {
    core.debug("Starting action...");
    const registry = core.getInput("ecr-registry");

    const sha = github.context.sha;
    const useSha = core.getInput("use-sha");
    const tagName = useSha ? sha : core.getInput("tag-name");

    const dockerFilePath = core.getInput("dockerfile-path") || "";
    const imageName = core.getInput("image-name");
    const aws_access_key_id = core.getInput("aws-access-key-id");
    const aws_secret_access_key = core.getInput("aws-secret-access-key");
    const aws_region = core.getInput("aws-region");
    console.log({
      registry,
      sha,
      useSha,
      tagName,
      dockerFilePath,
      imageName,
      aws_access_key_id,
      aws_secret_access_key,
      aws_region,
    });
    const awsImage = `${registry}:${tagName}`;

    const registryId = getRegistryId(registry);
    await loginToECR({
      accessId: aws_access_key_id,
      secretKey: aws_secret_access_key,
      region: aws_region,
      registryId,
    });
    await buildImage({ dockerFilePath, tagName, imageName });

    await tagImage({
      localImage: `${imageName}:${tagName}`,
      awsImage,
    });

    const digest = await pushImage({
      awsImage,
    });

    core.setOutput("digest", digest);
    core.setOutput("time-created", new Date().toTimeString());
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();

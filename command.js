const path = require("path");
const fs = require("fs/promises");
const {
  ECRClient,
  GetAuthorizationTokenCommand,
} = require("@aws-sdk/client-ecr");
const exec = require("@actions/exec");

const loginToECR = async ({ region, accessId, accessToken, registryId }) => {
  try {
    const config = {
      region,
      credentials: {
        accessKeyId: accessId,
        secretAccessKey: accessToken,
      },
    };

    const client = new ECRClient(config);

    const getAuthCommand = new GetAuthorizationTokenCommand({
      registryIds: [registryId],
    });

    const response = await client.send(getAuthCommand);

    const authorizationData = response.authorizationData[0];

    const authToken = Buffer.from(
      authorizationData.authorizationToken,
      "base64"
    ).toString("utf-8");

    const [username, password] = authToken.split(":");

    const proxyEndpoint = authorizationData.proxyEndpoint;
    const registryUri = proxyEndpoint.replace(/^https?:\/\//, "");

    //core.info(`Logging into registry ${registryUri}`);
    let doLoginStdout = "";
    let doLoginStderr = "";
    const exitCode = await exec.exec(
      "docker",
      ["login", "-u", username, "-p", password, proxyEndpoint],
      {
        silent: true,
        ignoreReturnCode: true,
        listeners: {
          stdout: (data) => {
            doLoginStdout += data.toString();
          },
          stderr: (data) => {
            doLoginStderr += data.toString();
          },
        },
      }
    );

    if (exitCode !== 0) {
      //core.debug(doLoginStdout);
      throw new Error(
        `Could not login to registry ${registryUri}: ${doLoginStderr}`
      );
    }

    console.log({
      doLoginStdout,
      doLoginStderr,
    });
  } catch (error) {
    console.log({ error });
    throw new Error(error);
  }
};

const getDigest = (logOutput) => {
  const regex = /sha256:[a-f0-9]{64}/g;
  const matches = [...logOutput.matchAll(regex)];

  const digests = matches.map((match) => match[0]);
  console.log({ digests });
  return digests[digests.length - 1];
};
/**
 * @param {string} logOutput
 * @returns {Array<{status: string, time: string}>}
 */
const getStatusAndTime = (logOutput) => {
  const regex = /#\d+ DONE (\d+\.\d+s)/g;
  let match;
  let lastMatch = null;

  while ((match = regex.exec(logOutput)) !== null) {
    lastMatch = match[1];
  }

  return lastMatch;
};
/**
 * @param {{ dockerFilePath: string, tagName:string, imageName: string }}
 */

const buildImage = async ({ dockerFilePath, tagName, imageName }) => {
  try {
    if (!dockerFilePath) {
      const dockerFilePath = path.join(process.cwd(), "Dockerfile");
      await fs.access(dockerFilePath);

      console.log("Dockerfile exists");
      const command = `docker build -t ${imageName}:${tagName} .`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          //   return;
          console.log(`stderr: ${stderr}`);
          const results = getStatusAndTime(stderr);
          console.log({ results });
          return results;
        }
      });
    } else {
      // todo
      console.log("Dockerfile exists");
    }
  } catch (error) {
    console.error(error);
  }
  // Check if there is a Dockerfile in the root directory
};

const tagImage = async ({ localImage, awsImage }) => {
  const command = `docker tag ${localImage} ${awsImage}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
  });
};

const pushImage = async ({ awsImage }) => {
  const command = `docker push ${awsImage}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    return getDigest(stdout);
  });
};

const getRegistryId = (registry) => {
  const regex = /^(\d+)\.dkr\.ecr\./;
  const match = registry.match(regex);

  if (match) {
    return match[1]; // Capture group 1 contains the registry ID
  } else {
    throw new Error("Could not extract registry ID from ECR URL");
  }
};
module.exports = {
  buildImage,
  tagImage,
  pushImage,
  loginToECR,
  getRegistryId,
};

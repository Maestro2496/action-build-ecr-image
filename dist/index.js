/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 685:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const path = __nccwpck_require__(928);
const fs = __nccwpck_require__(943);
const {
  ECRClient,
  GetAuthorizationTokenCommand,
} = __nccwpck_require__(712);
const core = __nccwpck_require__(194);
const exec = __nccwpck_require__(844);

const loginToECR = async ({ region, accessId, accessToken, registryId }) => {
  try {
    const config = {
      region,
      credentials: {
        accessKeyId: accessId,
        secretAccessKey: accessToken,
      },
    };
    core.debug(JSON.stringify(config));
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
      const dockerFilePath = __nccwpck_require__.ab + "Dockerfile";
      await fs.access(__nccwpck_require__.ab + "Dockerfile");

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


/***/ }),

/***/ 194:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 844:
/***/ ((module) => {

module.exports = eval("require")("@actions/exec");


/***/ }),

/***/ 518:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 712:
/***/ ((module) => {

module.exports = eval("require")("@aws-sdk/client-ecr");


/***/ }),

/***/ 943:
/***/ ((module) => {

"use strict";
module.exports = require("fs/promises");

/***/ }),

/***/ 928:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const core = __nccwpck_require__(194);
const github = __nccwpck_require__(518);
const {
  buildImage,
  tagImage,
  pushImage,
  loginToECR,
  getRegistryId,
} = __nccwpck_require__(685);

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

module.exports = __webpack_exports__;
/******/ })()
;
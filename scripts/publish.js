const { execSync } = require("child_process");
const { name, version, dockerUsername } = require("../package.json");

const app = name;
const username = dockerUsername;

const commands = [
  `docker build -t ${username}/${app}:${version} -t ${username}/${app}:latest -f Dockerfile.prod .`,
  `docker push ${username}/${app}:${version}`,
  `docker push ${username}/${app}:latest`
];

for (const cmd of commands) {
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

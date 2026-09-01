const [major = 0, minor = 0] = process.versions.node
  .split('.')
  .map((part) => Number.parseInt(part, 10))

if (major < 22 || (major === 22 && minor < 13)) {
  console.error(
    `AutoApply requires Node 22.13.0 or newer. Current Node is ${process.version}. Run "nvm use" from the repo root before running npm scripts.`
  )
  process.exit(1)
}

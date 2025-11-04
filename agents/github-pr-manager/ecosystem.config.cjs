module.exports = {
  apps: [
    {
      name: "github-pr-manager",
      script: "./dist/index.js",
      instances: 1,              // set "max" on Linux for cluster-mode if you understand sticky sessions
      exec_mode: "fork",         // use fork on Windows; change to "cluster" on Linux if desired
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 3001,
        // IMPORTANT: Do not store secrets here. Set GITHUB_TOKEN and WEBHOOK_SECRET
        // in your system environment or via pm2 ecosystem secrets (pm2 supports private configs).
        GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY || "brandonlacoste9-tech/adgenxai"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001
      }
    }
  ]
};
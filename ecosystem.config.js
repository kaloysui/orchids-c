module.exports = {
  apps: [
    {
      name: "bcine",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: max,              // pwede 'max' kung gusto nimo cluster mode
      autorestart: true,         // auto-restart kung mo-crash
      watch: false,              // disable sa production
      max_memory_restart: "800M", // restart if memory exceeds 200MB
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};

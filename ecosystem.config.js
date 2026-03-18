module.exports = {
  apps: [
    {
      name: "bcine",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "max",           // gamiton tanan CPU cores
      exec_mode: "cluster",       // cluster mode for load balancing
      autorestart: true,          // auto-restart kung mo-crash
      watch: false,               // disable watch sa production
      max_memory_restart: "2G", // auto-restart kung mo-abot sa 300MB
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};

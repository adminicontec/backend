module.exports = {
  apps : [
    {
      name: "campus_virtual_dist",
      script: 'npm run start',
      instance: "max",
      exe_mode: "cluster",
      env: {
        "NODE_ENV": "development"
      },
      env_production: {
        "NODE_ENV": "production"
      }
    }
  ]
};

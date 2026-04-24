module.exports = {
  apps: [{
    name: 'blocks',
    script: '.output/server/index.mjs',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000,
      HOST: process.env.HOST || '127.0.0.1'
    },
    max_memory_restart: '256M'
  }]
}

// Configuração do PM2 — mantém o Surfyng API rodando no VPS com cluster mode
module.exports = {
  apps: [
    {
      name:    'surfyng-api',
      script:  './dist/app.js',

      // Cluster mode: usa todos os núcleos da CPU para paralelismo real
      instances:  'max',
      exec_mode:  'cluster',

      // Não observa arquivos em produção (somente reinicia via deploy)
      watch: false,

      // Reinicia se consumir mais de 500 MB (vazamento de memória)
      max_memory_restart: '500M',

      // Reinicia automaticamente se o processo cair
      autorestart:   true,
      restart_delay: 3000,   // ms entre tentativas
      max_restarts:  10,

      // Logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file:        './logs/out.log',
      error_file:      './logs/error.log',
      merge_logs:      true,
      combine_logs:    true,

      // Variáveis de ambiente para desenvolvimento
      env: {
        NODE_ENV: 'development',
        PORT:      3000,
      },

      // Variáveis de ambiente para produção — usar: pm2 start ecosystem.config.js --env production
      env_production: {
        NODE_ENV: 'production',
        PORT:      3000,
      },
    },
  ],
};

import './core/config/env.config';
import app from './app';
import { env } from './core/config/env.config';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

export default server;

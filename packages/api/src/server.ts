import Fastify from 'fastify';
import cors from '@fastify/cors';

const server = Fastify({
  logger: true
});

server.register(cors, { origin: true });

server.get('/api/health', async (request, reply) => {
  return { 
    success: true, 
    message: 'Мобильный Обходчик API is running!',
    timestamp: new Date().toISOString()
  };
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server is running on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
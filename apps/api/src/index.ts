import Fastify from "fastify";

const server = Fastify({ logger: true });

server.get("/", async () => {
  return { message: "Fastify API is up and running." };
});

const port = Number(process.env.PORT) || 4000;

server
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    console.log(`API listening on http://localhost:${port}`);
  })
  .catch((err) => {
    server.log.error(err);
    process.exit(1);
  });

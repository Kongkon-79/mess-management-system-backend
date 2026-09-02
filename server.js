

import app from "./src/app.js";
import { serverPort } from "./src/config/config.js";
import { connectDb } from "./src/config/db.js";

const startServer = async () => {
  await connectDb();

  app.listen(serverPort, () => {
    console.log(`Server running on http://localhost:${serverPort}`);
  });
};

startServer();
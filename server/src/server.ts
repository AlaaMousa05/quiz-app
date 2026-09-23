import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";

const env = loadEnv();

createApp().listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});

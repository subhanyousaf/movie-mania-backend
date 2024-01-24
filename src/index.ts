import { createApp } from "./utils/createApp";

async function main() {
  try {
    const app = createApp();
    app.listen(5000, "0.0.0.0", () => {
      console.log("Server is running on port 5000");
    });
  } catch (error) {}
}

main();

// Process entrypoint: starts the HTTP server. The Express app itself lives in
// app.ts (index.ts) so tests can import it with supertest without binding a port.
import { app } from "./index.js";
import { CONFIG } from "./services/config.js";

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`AI Security Stack Mapper API listening on http://localhost:${PORT}`);
  console.log(
    `Integrations: TE=${CONFIG.checkpointTE.mock ? "mock" : "live"}, FileScan=${
      CONFIG.checkpointFileScan.mock ? "mock" : "live"
    }, Lakera=${CONFIG.lakeraGuard.mock ? "mock" : "live"}`
  );
});

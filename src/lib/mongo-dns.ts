import dns from "node:dns/promises";

let configured = false;

// Optional process-level override for networks whose DNS resolver blocks SRV
// queries. Leave unset to use the deployment's normal DNS configuration.
export function configureMongoDns() {
  const servers = process.env.MONGODB_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);
  if (configured || !servers?.length) return;
  dns.setServers(servers);
  configured = true;
}

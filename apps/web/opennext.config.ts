import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Cloudflare-specific configuration
  // This uses the default Cloudflare settings optimized for Pages/Workers
  
  // You can customize bindings and environment variables here if needed
  // Most configuration is handled via wrangler.toml
});

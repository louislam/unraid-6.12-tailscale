# Fork of Unraid-tailscale for Unraid 6.12

## Why?

The unraid-tailscale plugin had dropped support for Unraid 6.12. This is a fork to keep Tailscale updated for Unraid 6.12 users.

## How to install 

Go to Unraid Dashboard -> Plugins -> Install Plugin and paste the following URL:

```
https://raw.githubusercontent.com/louislam/unraid-6.12-tailscale/refs/heads/master/plugin/tailscale.plg
```


## Notes

### Automated Updates

The repository includes an automated update script (`update.ts`) that checks for the latest Tailscale version and updates the plugin accordingly.

**Prerequisites:**
- Deno runtime (https://deno.land/)

**Usage:**
```bash
./update.ts
# or
deno run --allow-net --allow-read --allow-write --allow-run update.ts
```

**What it does:**
1. Fetches the latest Tailscale version from https://pkgs.tailscale.com/stable/
2. Compares with the current version in `tools/plugin/tailscale.json`
3. If an update is available:
   - Updates the version (YYYY.MM.DD format)
   - Updates tailscaleVersion (tailscale_{VERSION}_amd64)
   - Updates tailscaleSHA256 (checksum of the amd64 package)
   - Executes `tools/build-plugin.sh` to rebuild the plugin
4. If already up-to-date, exits without making changes

### Build


Setup environment

```bash
wsl --install debian --web-download
wsl
pip install jinja2-cli
```

```bash
cd tools
./build-plugin.sh
```

Official Repo: https://github.com/unraid/unraid-tailscale

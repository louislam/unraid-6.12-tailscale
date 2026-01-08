# Fork of Unraid-tailscale for Unraid 6.12

## Why?

The unraid-tailscale plugin had dropped support for Unraid 6.12. This is a fork to keep Tailscale updated for Unraid 6.12 users.

## How to Install / Update

Go to Unraid Dashboard -> Plugins -> Install Plugin and paste the following URL:

```
https://raw.githubusercontent.com/louislam/unraid-6.12-tailscale/refs/heads/master/plugin/tailscale.plg
```

## Notes

### Build

Setup environment

For Windows only:

```bash
wsl --install debian --web-download
wsl
```

For Linux:

```bash
sudo apt update && apt install python3-pip curl unzip
pip install jinja-cli
curl -fsSL https://deno.land/install.sh | sh
```

Restart terminal and run:

```bash
deno task update
```

Official Repo: https://github.com/unraid/unraid-tailscale

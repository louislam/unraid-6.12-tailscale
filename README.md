# Fork of Unraid-tailscale for Unraid 6.12

## Why?

The unraid-tailscale plugin had dropped support for Unraid 6.12. This is a fork to keep Tailscale updated for Unraid 6.12 users.

## How to install 

Go to Unraid Dashboard -> Plugins -> Install Plugin and paste the following URL:

```
https://raw.githubusercontent.com/louislam/unraid-6.12-tailscale/refs/heads/master/plugin/tailscale.plg
```


## Notes

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

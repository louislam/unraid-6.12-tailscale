#!/bin/sh

jinja -d plugin/tailscale.json -D filename tailscale -D branch master plugin/tailscale.j2 > ../plugin/tailscale.plg

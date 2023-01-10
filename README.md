# Remote Link

Open a link to your exact line of code in a browser. Compatible with GitHub and GitLab.

![](./static/demo.gif)

## Features

* Open command pallete (`cmd`/`ctrl` + `shift` + `p`) and type either "Copy Link to Code" or "Open in browser".
* Set keyboard shortcuts for `remote-link.copyLink` or `remote-link.openLink` if you want easier access.

## Requirements

Your workspace must be a valid git repository.

Only GitHub and GitLab have been tested. Other git providers will not work unless they share the same URL structure.

## How?

Inspects and parses `git remote` to find the URL of the project.

## Release Notes

See [CHANGELOG.md](./CHANGELOG.md).

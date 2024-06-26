# bedrock-stdhub

English | [简体中文](README.zh.md)

A completely external 'hub' to load plugins with _unmodified_ Bedrock Dedicated Server.

The word 'stdhub' is a combination of 'stdlib' and 'hub'. This application acts as a 'hub' to load plugins in form of behavior packs and provides plugins with a set of so-called 'standard libraries' for Server-side behavior packs to break out of the 'sandbox' of Scripting environment.

# Usage

Please refer to the [documentation](https://bedrock-stdhub.gdt.pub/get-started.html) on the official website.

## Debug Mode

If you want to debug your plugins, please add the flag `--debug-mode` when executing `bedrock-stdhub`. Then the application will listen to every existent file in `plugins` folder. When any file in this folder changes, it will copy new plugin files to the world folder and delete the old. However, it won't listen to newly-added files, nor will it copy it to the world folder. So if you want to have a test on new plugins, please restart the application.

---

> `bedrock-stdhub` is still in active development. Please see issues page for currently unfixed issues. Great thanks if you can provide a solution or, what is better, open a pull request to solve the problems.
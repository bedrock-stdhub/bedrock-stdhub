# bedrock-stdhub

A completely external 'hub' to load plugins with Bedrock Dedicated Server.

The word 'stdhub' is a combination of 'stdlib' and 'hub'. This application acts as a 'hub' to load plugins in form of behavior packs and provides plugins with a set of so-called 'standard libraries' for Server-side behavior packs to 'break out of' Scripting environment.

# Usage

Put the published executable and a BDS executable (named `bedrock_server(.exe)` by default) in the same directory. Then simply execute `bedrock-stdhub-(architecture)` to start the server.

To add plugins, please copy the built `.mcaddon` file into `plugins` folder.

## Debug Mode

If you want to debug your plugins, please add the flag `--debug-mode` when executing `bedrock-stdhub`. Then the application will listen to every existent file in `plugins` folder. When any file in this folder changes, it will copy new plugin files to the world folder and delete the old. However, it won't listen to newly-added files, nor will it copy it to the world folder. So if you want to have a test on new plugins, please restart the application.
# bedrock-stdhub

A completely external 'hub' to load plugins with Bedrock Dedicated Server.

The word 'stdhub' is a combination of 'stdlib' and 'hub'. This application acts as a 'hub' to load plugins in form of behavior packs and provides plugins with a set of so-called 'standard libraries' for Server-side behavior packs to 'break out of' Scripting environment.

# Usage

Put the published executable and a BDS executable (named `bedrock_server(.exe)` by default) in the same directory. Then simply execute `mc-bedrock-stdhub-(architecture)` to start the server.
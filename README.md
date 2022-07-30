Reference Documentation 
https://firebase.google.com/docs/reference/node/firebase.database

Run the emulators:
firebase emulators:start
Only functions:
firebase emulators:start --only functions

Have webpack build on modifications:
npm run watch

Deploy
firebase deploy --only functions

Connect to the shell to launch functions manually (especially scheduled pubsub ones that do not work locally):
firebase functions:shell

Pubsub schedule syntax:
https://cloud.google.com/appengine/docs/standard/python/config/cronref?authuser=0&hl=fr

Check local rules:
http://localhost:9000/.inspect/coverage?ns=xxx
[x] - need to remove the noise on the log, it is a bit too much:
```txt
[2025-10-24 08:04:45.047][TEST_APP][WS][/cantina/a]: Handling WebSocket upgrade { url: '/cantina/a' }
[2025-10-24 08:04:45.048][TEST_APP][WS][/cantina/a]: Client watching path cantina/a
[2025-10-24 08:04:45.049][TEST_APP][WS][/cantina/a]: Client added to watchers { totalWatchers: 1 }
[2025-10-24 08:04:51.395][TEST_APP][POST][/cantina/a]: Params:  [Object: null prototype] { path: [ 'cantina', 'a' ] }
[2025-10-24 08:04:51.396][TEST_APP][POST][/cantina/a]: Body:  {"prompt":"This is new new new new"}
[2025-10-24 08:04:51.396][TEST_APP][POST][/cantina/a]: file path:  cantina/a
[2025-10-24 08:04:51.396][TEST_APP][POST][/cantina/a]: Saving JSON file
[2025-10-24 08:04:51.396][TEST_APP][POST][/cantina/a]: Broadcasting change
[2025-10-24 08:04:51.397][TEST_APP][WS][-]: Broadcasting change { jsonFile: 'cantina/a', data: { prompt: 'This is new new new new' } }
[2025-10-24 08:04:51.397][TEST_APP][WS][-]: Sending message to client {"path":"cantina/a","data":{"prompt":"This is new new new new"}} {
  message: '{"path":"cantina/a","data":{"prompt":"This is new new new new"}}'
```
[x] - Need to test if the broad cast works with the deletion of a file
[x] - Create tests so I am not running this constently
[x] - the app name token validation generates the the folder in which the data is stored
[ ] - the app keys and names should no be a config of env/docker files but a json that I can change any time without having to rebuild
[ ] - create the client that can use this and a template or doc or example

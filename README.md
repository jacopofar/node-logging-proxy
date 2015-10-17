This script connects to a Postgres database and store all of the HTTP requests metadata (not HTTPS, however the included proxy library can work with forged certificates).


Usage
-----
    export DATABASE_CONN_STRING="postgres://surfer:surfer@localhost/surfing"
    export PORT=8081
    node index.js


The environment variables can be omitted, in that case the two of the example will be used.

The program was tested using Postgres 9.5 (beta 1) and Firefox on Mac OS. There were no visible performance issues while surfing.


It supports websockets (ws://).

The table *visits* will contain the visited URL, the host, the headers as a json object and the timestamp of the request.
# node-logging-proxy

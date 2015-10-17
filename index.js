'use strict';

var pg = require('pg');
var Proxy = require('http-mitm-proxy');
var proxy = Proxy();
var dns = require('dns');

var connString = process.env.DATABASE_CONN_STRING||"postgres://surfer:surfer@localhost/surfing";
var getClient = function(cb){
  pg.connect(connString, function(err,client, done) {
    if(err) {
      throw new Error('error fetching client from pool'+err);
    }
    cb(client,done);
});
};

getClient(function(client,done){
  client.query('CREATE TABLE IF NOT EXISTS visits(host TEXT, url TEXT, headers json, time timestamp);',
  function(err, result) {
    if(err) {
      return console.error('error initializing the database:', err);
    }
    done();
  });
});

proxy.onError(function(ctx, err) {
  console.error('proxy error:', err);
});

process.on('uncaughtException', function(err){
  console.log("\n\n ++++ \n\n");
  console.log(err);
});

proxy.onRequest(function(ctx, proxy_callback) {
  console.log("visiting "+ctx.clientToProxyRequest.headers.host+ctx.clientToProxyRequest.url);
  if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:[1-9][0-9]*)?$/.test(ctx.clientToProxyRequest.headers.host)){
    console.log("it's an IP, not looking up the host name");
    return proxy_callback();
  }
  dns.lookup(ctx.clientToProxyRequest.headers.host,function(domain_error){
    if(domain_error){
      console.log(" WARNING: domain not found: "+ctx.clientToProxyRequest.headers.host);
      return proxy_callback("failed DNS lookup for domain '"+ctx.clientToProxyRequest.headers.host+"'");
    }
      getClient(function(client,done){
        client.query('INSERT INTO visits(host, url, headers, time) VALUES ($1,$2,$3,$4)',
        [ctx.clientToProxyRequest.headers.host,
          ctx.clientToProxyRequest.url,
          ctx.clientToProxyRequest.headers,
          new Date()
        ],
        function(err, result) {
          if(err) {
            return console.error('error writing a visit in the database:', err);
          }
          done();
        });
      });
    return proxy_callback();
  });
});

var port = process.env.PORT||8081;
console.log("proxy listening on port: "+port);
proxy.listen({port: port});

#!/usr/bin/env node
// vim: set filetype=javascript:
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var program = require('commander');
var http = require('http');
var serveStatic = require('serve-static');
var finalhandler = require('finalhandler');

program
  .option('--host <hostname>', 'Host', String, 'localhost')
  .option('--port <port>', 'Port', Number, 8080)
  .option('--secret <secret>', 'Secret string', String)
  .option('--websocket <url>', 'Noflo runtime websocket address', String)
  .parse(process.argv);

var origin = program.host + ':' + program.port;
var suffix = '%26secret%3D' + encodeURIComponent(program.secret);
var hash = '#runtime/endpoint?protocol%3Dwebsocket%26address%3D' +
    encodeURIComponent(program.websocket) + (program.secret ? suffix : '');
program.url = 'http://' + origin + '/';
program.page = 'http://' + origin + '/index.html' + (program.websocket ? hash : '');

var baseDir = path.join(__dirname, '..');

var serve = serveStatic(baseDir);

Promise.resolve(http.createServer(function(req, res){
    var done = finalhandler(req, res);
    if (req.url == '/') {
        res.statusCode = 302;
        res.setHeader('Location', program.page);
        res.end();
    } else if (req.url.indexOf('/node/') !== 0) {
        serve(req, res, done);
    }
})).then(function(server){
    return promiseResult(server.listen, server, program.port).then(function(port){
        console.log('NoFlo UI is available at ' + program.url);
        console.log('Using ' + baseDir + ' for noflo-ui');
    });
}).then(function(){
    return promiseResult(process.on, process, 'SIGINT');
}).then(function(){
    process.exit(0);
}).catch(function(error){
    console.error(error, error.stack);
    process.exit(1);
});

function promiseResult(fn, context /* arguments */) {
    var args = _.toArray(arguments).splice(2);
    return new Promise(function(resolve, reject){
        fn.apply(context, args.concat(resolve));
    });
}


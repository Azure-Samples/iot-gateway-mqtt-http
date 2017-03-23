// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var https = require('https');
var fs = require('fs');

function HttpsServerModule() {
    this.server = null;
};

HttpsServerModule.prototype.create = function (messageBus, configuration) {

    var options = {
        key: fs.readFileSync('tls-key.pem'),
        cert: fs.readFileSync('tls-cert.pem')
    };

    this.server = new https.createServer(options, function (req, res) {
        var url = req.url.split('/');

        /**/ if (req.method === 'POST' &&
            url.length >= 5 &&
            url[1] === 'devices' &&
            url[3] === 'messages' &&
            url[4].split('?')[0] === 'events') {

            var headers = req.headers;
            var bus = this.messageBus;
            var body = '';

            req.setEncoding('utf-8'); 
            req.on('data', function (chunk) {
                body += chunk;
            });
            req.on('end', function () {
                try {
                    bus.publish(
                        {
                            properties: {
                                'source': 'mapping',
                                'deviceName': url[2],
                                'deviceToken': headers.authorization,
                                'Content-Type': 'application/octet-stream'
                            },
                            content: Buffer.from(body, 'utf-8')
                        }
                    );
                    res.statusCode = 200;
                    res.end();
                }
                catch (err) {
                    console.log('Discarding message.');
                    res.statusCode = 500;
                    res.end();
                }
            });
        }
        else if (req.method === 'GET' &&
            url.length >= 4 &&
            url[1] === 'devices' &&
            url[3] === 'messages' &&
            url[4].split('?')[0] === 'deviceBound') {

             res.statusCode = 401;  // Not impl.
            res.end('Unsupported');
        }
        else {
            console.error('Bad request from %s', req.url);
            res.statusCode = 403;
            res.end();
        }
    });

    this.server.messageBus = messageBus;

    var ifAddress = configuration != null ? configuration.LocalAddress : null;
    console.log('HTTP/S Server (%s:443) starting...', ifAddress || '::');
    this.server.listen(443, ifAddress, function () {
        console.log('HTTP/S Server running.');
    });

    return true;
};

HttpsServerModule.prototype.receive = function (message) {
    // Not supported
};

HttpsServerModule.prototype.destroy = function () {
    this.server.close(function () {
        console.log('HTTP/S Server stopped.');
    });
};

// test
// var start = new HttpsServerModule();
// start.create(null, null);

module.exports = new HttpsServerModule()
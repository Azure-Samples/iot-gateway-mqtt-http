// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var mosca = require('mosca');

function MqttBrokerModule() {
    this.server = null;
};

MqttBrokerModule.prototype.create = function (messageBus, configuration) {

    var moscaSettings = {
        interfaces: [{ 
            type: "mqtts", 
            port: 8883,
            host: configuration != null ? configuration.LocalAddress : null,
            credentials: {
                keyPath: 'tls-key.pem',
                certPath: 'tls-cert.pem'
            }
        },
        {
            type: "https",
            port: 3001,
            host: configuration != null ? configuration.LocalAddress : null,
            credentials: {
                keyPath: 'tls-key.pem',
                certPath: 'tls-cert.pem'
            }
        }],
        persistence: mosca.persistence.Memory
    };
	
    console.log('MQTT Broker starting...');
    this.server = new mosca.Server(moscaSettings, function () {
        console.log('MQTT Broker running.');
    });

    this.server.messageBus = messageBus;

    this.server.published = function (packet, client, cb) {
        console.log('Received message from %s', packet.topic);
        var topic = packet.topic.split('/');
        if (topic.length >= 4 &&
            topic[0] === 'devices' &&
            topic[2] === 'messages' &&
            topic[3] === 'events') {

            if (this.messageBus != null &&
                topic[1] === client.username) {

                this.messageBus.publish(
                    {
                        properties: {
                            'source': 'mapping',
                            'deviceName': client.username,
                            'deviceToken': Buffer.from(client.password).toString('utf-8')
                        },
                        content: packet.payload
                    }
                );
            } else {
                console.log('Discarding message.');
            }
        }
        return cb();
    }

    this.server.authenticate = function (client, username, password, cb) {
        client.username = username.substr(username.indexOf('/') + 1);
        client.password = password;
        cb(null, client.password != null);
    }
    return true;
};

MqttBrokerModule.prototype.receive = function (message) {
	
	// Append properties as urlencoded(name)=urlencoded(value)&
	var topic = 'devices/' + message.properties.deviceName + '/messages/devicebound/'
	
	for (var name in message.properties) {
		topic += (encodeURIComponent(name) + '=' 
			+ encodeURIComponent(message.properties[name]) + '&');
	}
	
	if (topic[topic.length-1] === '&') {
		topic = topic.substr(0, topic.length - 1);
	}
    
	console.log('Publish message to %s', topic);
    this.server.publish(
	{
        topic: topic,
        payload: Buffer.from(message.content)
    });
};

MqttBrokerModule.prototype.destroy = function () {
    this.server.close(function () {
        console.log('MQTT Broker stopped.');
    });
};

// test
// var start = new MqttBrokerModule();
// start.create(null, null);

module.exports = new MqttBrokerModule()
---
services: iothub
platforms: node, dotnet 
author: marcschier
---

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments

# Sample MQTT and HTTP Gateway modules

This project provides two Gateway modules that expose IoTHub like MQTT and HTTPS endpoints for telemetry upload and in the case of
MQTT module C2D messaging:

## Mqtt broker module
The Mqtt broker module utilizes [Mosca](https://github.com/mcollina/mosca), version 2.0.2.  
Mosca supports TLS with mutual authentication, however only Server authentication is provided as part of the sample.  Client certificate 
validation can be added to improve security by changing the ```authenticate``` prototype function.  

The Mqtt module can be configured to listen on a specified interface using the ```LocalAddress``` property.  Set this property in the
module ```args``` of the gateway's ```config.json``` to the IP address of the interface the server should listen on.  By default the
server listens on all interfaces (= null).  

## HTTP/s server module
The HTTP/s webserver module uses the built in node.js HTTPS server functionality.  It currently only supports POST messages, and no GET 
polling.

The server can be configured to listen on a specified interface using the ```LocalAddress``` property.  Like in the case of
Mqtt, set this property in the module's ```args``` section of the gateway's ```config.json```.  By default the
server listens on all interfaces (= null).  

# Building and running the Gateway 

## Azure IoT Gateway SDK compatibility
The current version of the modules are targeted at the Azure IoT Gateway SDK at commit '287beed07490d98a24a4e9ddd33ec7127fc3acbf'.

Use the following command line to clone the compatible version Azure IoT Gateway SDK, then follow the build instructions included:

```
git clone --recursive https://github.com/Azure/azure-iot-gateway-sdk.git
git checkout 287beed07490d98a24a4e9ddd33ec7127fc3acbf
```

## Building

Ensure you have the following tools installed on your development machine:

- [npm](https://nodejs.org/en/download/current/)
- Openssl or equivalent tool (to generate certificates)

Build the Gateway using the Azure IoT Gateway SDK build script. Enable the node.js binding by passing the ```--enable-node-binding``` command line option.  then run
```
npm install iot-gateway-mqtt-http --save`
```

## Generating TLS certs for testing

Generate a self signed certificate and private key to identify the GW and enable TLS/SSL. 
This can be done with openssl, e.g. open a command shell in this folder and run:
    ```
    openssl genrsa -out tls-key.pem 2048
    openssl req -new -sha256 -key tls-key.pem -out tls-csr.pem
    openssl x509 -req -in tls-csr.pem -signkey tls-key.pem -out tls-cert.pem
    ```
    *Hint: Sometimes it is necessary to set the OPENSSL_CONF ENV variable to the location of the openssl.cnf file.*

    > IMPORTANT: Ensure that you correctly enter the name of your gw host machine as the server when creating the certificate.  Clients
    will validate the server name in the GW provided certificate against the host name they connect to.  If names do not match, the 
    connection is sometimes refused before your code can validate the certificate.

## Configure the gateway

Add the following to the `modules` section of your gateway JSON configuration file:

```javascript 
{
    "modules": [
        {
        "name": "mqtt",
            "loader": {
                "name": "node",
                "entrypoint": {
                    "main.path": ".\node_modules\iot-gateway-mqtt-http\mqtt.js"
                }
            },
            "args": {
                "LocalAddress": null
            }
        },
        {
        "name": "https",
            "loader": {
                "name": "node",
                "entrypoint": {
                    "main.path": ".\node_modules\iot-gateway-mqtt-http\https.js"
                }
            },
            "args": {
                "LocalAddress": null
            }
        },
        ...
```

Then in the `links` section, patch the module into the message flow:

```javascript 
    ],
    "links": [
        {"source": "iothub", "sink": "mqtt"},
        {"source": "mqtt", "sink": "iothub"},
        {"source": "https", "sink": "iothub"},
        ...
    ]
}
```

# License

This project is licensed under the [MIT License](LICENSE).

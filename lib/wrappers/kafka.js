'use strict';

var kafka = require('kafka-node'),
    HighLevelConsumer = kafka.HighLevelConsumer,
    Offset = kafka.Offset;
 
var Kafka = function () {
    var kafka_config;
    var kafka_service;

    return {
        Init: function(kafkaConfig, callback){
            kafka_config = kafkaConfig;
            kafka_service = require('../services/kafka')(kafka_config.uri, function(error){
                if(error){
                    console.log("Error on kafka require: ", error);
                    callback(true);
                    return;
                }

                kafka_service.createTopic(kafka_config.topicName, function(err, res){
                    if(err){
                        console.info(err);
                        console.log("Error creating kafka topic:", err);
                        callback(true);
                        return;
                    }
                    else{
                        console.log("Kafka running");
                    }

                    callback(null);
                });
            });
        },
        CreateConsumer: function(topic, callback){
            var client = new kafka.Client(kafka_config.uri);

            var consumer = new HighLevelConsumer(client, [ { topic: topic, partition: 0, offset: 0 } ], { autoCommit: false, fromOffset: true });
            consumer.on('message', callback);

            var offset = new Offset(client);

            offset.fetch([{ topic: kafka_config.topicName, partition: 0, time: -1 }], function (err, data) {
                var latestOffset = 0;

                if(err){
                    console.log("Offset fetch error:", err);
                }

                if(data && data[kafka_config.topicName]){
                    console.log("Consumer current offset: " + latestOffset);
                    consumer.setOffset(kafka_config.topicName, 0, data[kafka_config.topicName]['0'][0]);
                }
            });
        },
        Send: function(data, callback){
            kafka_service.send(kafka_config.topicName, data, callback);
        }
    };
};

module.exports = Kafka;
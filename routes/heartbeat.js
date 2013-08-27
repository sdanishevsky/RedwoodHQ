var realtime = require('./realtime');

exports.heartbeatPost = function(req, res){
    var app =  require('../common');
    var data = req.body;
    var ip = req.connection.remoteAddress;

    findMachine(app.getDB(),data,ip,function(machine){
        if (machine == null){
            createMachine(app.getDB(),{roles:["Default"],host:ip,vncport:data.vncPort,machineVars:[],port:data.port,maxThreads:1,description:"host name is:"+data.hostname,macAddress:data.macAddress})
        }
        else{
            if (machine.macAddress){
                if((machine.host != data.hostname) && (machine.host != ip)){
                    updateMachine(app.getDB(),machine._id,{$set:{host:ip,vncport:data.vncPort,port:data.port,macAddress:data.macAddress}})
                }
                else{
                    updateMachine(app.getDB(),machine._id,{$set:{vncport:data.vncPort,port:data.port}})
                }
            }
            else{
                updateMachine(app.getDB(),machine._id,{$set:{macAddress:data.macAddress,vncport:data.vncPort,port:data.port}})
            }
        }
    });
    res.contentType('json');
    res.json({
        success: true
    });
};

exports.initHeartBeat = function(machine){
    var db = app.getDB();

    db.collection('machines', function(err, collection) {
        collection.find({}, {}, function(err, cursor) {
            cursor.each(function(err, machine) {
                if(machine == null) {
                    callback(machines);
                }
                machines.push(machine);
            });
        })
    })
};

function findMachine(db,data,ip,callback){
    var query = {macAddress:data.macAddress};

    db.collection('machines', function(err, collection) {
        collection.findOne(query, {}, function(err, machine) {
            if (machine != null){
                callback(machine);
            }
            else{
                query = {host:{$in:[data.hostname,ip]}};
                collection.findOne(query, {}, function(err, machine) {
                        callback(machine);
                });
            }
        })
    })
}


function updateMachine(db,id,query,callback){
    db.collection('machines', function(err, collection) {
        collection.findAndModify({_id:id},{},query,{safe:true,new:true},function(err,data){
            if (data != null) realtime.emitMessage("UpdateMachines",data);
            if (err) console.warn(err.message);
            else if(callback) callback(err);
        });
    });
}

function createMachine(db,data,callback){
    db.collection('machines', function(err, collection) {
        data._id = db.bson_serializer.ObjectID(data._id);
        collection.insert(data, {safe:true},function(err,returnData){
            if (returnData != null) realtime.emitMessage("AddMachines",returnData);
            if (callback) callback(returnData);
        });
    });
}


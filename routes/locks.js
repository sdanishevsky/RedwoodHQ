const ObjectID = require('mongodb').ObjectID;

const LOCKS_COLLECTION = 'locks';
const LOCK_TYPE_TESTCASE = 'testcase';
const LOCK_TYPE_ACTION = 'action';

exports.createLock = function(req, res) {
    const app = require('../common');
    const db = app.getDB();
    res.contentType('json');

    // Validating data
    const lock = req.body;
    if (!lock.type || (lock.type !== LOCK_TYPE_TESTCASE && lock.type !== LOCK_TYPE_ACTION) || !lock.id) {
        return res.status(400).json({ success: false });
    }
    lock.username = req.cookies.username;
    lock._id = new ObjectID();
    
    // Adding new lock into the database
    db.collection(LOCKS_COLLECTION, function(err, collection) {
        collection.ensureIndex({ type: 1, id: 1 }, { unique: true }, function(indexErr) {
            if (indexErr) {
                console.warn(indexErr.message);
            }
            collection.insert(lock, function(insertErr) {
                if (insertErr) {
                    console.warn(insertErr.message);
                }
                res.json({
                    success: !insertErr,
                    lock
                });
            });
        });
    });
};

exports.removeLock = function(req, res) {
    
};

exports.checkLock = function(req, res) {
    
};

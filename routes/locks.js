const ObjectID = require('mongodb').ObjectID;

const LOCKS_COLLECTION = 'locks';
const LOCK_TYPE_TESTCASE = 'testcase';
const LOCK_TYPE_ACTION = 'action';

function isValidInput(data) {
    if (!data.type || (data.type !== LOCK_TYPE_TESTCASE && data.type !== LOCK_TYPE_ACTION) || !data.id) {
        return false;
    }
    return true;
}

exports.createLock = function(req, res) {
    const app = require('../common');
    const db = app.getDB();
    const data = req.body;
    const username = req.cookies.username || null;
    res.contentType('json');

    // Validating data
    if (!isValidInput(data)) {
        res.status(400).json({ success: false });
        return;
    }
    
    db.collection(LOCKS_COLLECTION, function(err, collection) {
        collection.ensureIndex({ type: 1, id: 1 }, { unique: true }, function(indexErr) {
            if (indexErr) { console.warn(indexErr.message); }
            // Checking if lock is already exists
            collection.findOne(data, function(findErr, result) {
                if (findErr) { console.warn(findErr.message); }
                if (result) {
                    if (result.username === username) {
                        res.json({
                            success: true,
                            isLocked: false
                        });
                    } else {
                        res.json({
                            success: true,
                            isLocked: true,
                            lockedBy: result.username
                        });
                    }
                    return;
                }
                // Adding new lock into the database
                data.username = username;
                data.createdAt = new Date().toISOString();
                data._id = new ObjectID();
                collection.insert(data, function(insertErr) {
                    if (insertErr) { console.warn(insertErr.message); }
                    res.json({
                        success: !insertErr,
                        isLocked: false
                    });
                });
            });
        });
    });
};

exports.removeLock = function(req, res) {
    const app = require('../common');
    const db = app.getDB();
    const data = req.body;
    const username = req.cookies.username;
    res.contentType('json');

    // Validating data
    if (!isValidInput(data)) {
        res.status(400).json({ success: false });
        return;
    }

    db.collection(LOCKS_COLLECTION, function(err, collection) {
        // Checking that lock exists for this user
        collection.findOne({
            id: data.id,
            type: data.type,
            username
        }, function(findErr, result) {
            if (findErr) {
                console.warn(findErr.message);
                res.status(500).json({ success: false });
                return;
            }
            if (!result) {
                res.json({ success: true });
                return;
            }
            // Deleting lock
            collection.remove({ _id: result._id }, { justOne: true }, function(deleteErr) {
                if (deleteErr) {
                    res.status(500).json({ success: false });
                    return;
                }
                res.json({ success: true });
            });
        });
    });
};

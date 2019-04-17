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
    res.contentType('json');

    // Validating data
    if (!isValidInput(data)) {
        res.status(400).json({ success: false });
        return;
    }
    data.username = req.cookies.username;
    data._id = new ObjectID();
    
    // Adding new lock into the database
    db.collection(LOCKS_COLLECTION, function(err, collection) {
        collection.ensureIndex({ type: 1, id: 1 }, { unique: true }, function(indexErr) {
            if (indexErr) {
                console.warn(indexErr.message);
            }
            collection.insert(data, function(insertErr) {
                if (insertErr) {
                    console.warn(insertErr.message);
                }
                res.json({
                    success: !insertErr,
                    lock: data
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
                res.status(404).json({ success: false });
                return;
            }
            if (!result) {
                res.status(404).json({ success: false });
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

exports.checkLock = function(req, res) {
    const app = require('../common');
    const db = app.getDB();
    const data = {
        id: req.query.id,
        type: req.query.type
    };
    const username = req.cookies.username;
    res.contentType('json');

    // Validating data
    if (!isValidInput(data)) {
        res.status(400).json({ success: false });
        return;
    }

    db.collection(LOCKS_COLLECTION, function(err, collection) {
        // Finding lock
        collection.findOne(data, function(findErr, result) {
            var locked = false;
            if (findErr) {
                console.warn(findErr.message);
            }
            if (result && result.username !== username) {
                locked = true;
            }
            res.json({
                success: true,
                locked
            });
        });
    });
};

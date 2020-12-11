const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);

let db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.helloWorld = functions.https.onRequest((request, response) => {
    db.collection('users').get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                console.log(doc.id, '=>', doc.data());
            });
        })
        .catch((err) => {
            console.log('Error getting documents', err);
        });

    functions.firestore
        .document('users/alovelace')
        .onUpdate((change, context) => {
            // Get an object representing the document
            // e.g. {'name': 'Marie', 'age': 66}
            const newValue = change.after.data();

            // ...or the previous value before this update
            const previousValue = change.before.data();

            // access a particular field as you would any JS property
            const name = newValue.name;
            console.log(name);
            // perform desired operations ...
        });
    response.send("Hello from Firebase!");
});

exports.getPresentertion = functions.https.onCall((data, context) => {
    var id;
    db.collection('presentation')
        .doc('now_presentation')
        .get()
        .then(doc => {
            id = doc.data().now_id;
        })
        .catch((err) => {
            console.log('Error getting documents', err);
        });
    return {
        id: id
    }
});

exports.getPresentertionReceive = functions.https.onCall((data, context) => {
    return receive = db.collection('presentation')
        .doc('now_presentation')
        .onSnapshot(querySnapshot => {
            id = querySnapshot.data().now_id;
            console.log(id);
            return { id: id };
        }, err => {
            console.log(`Encountered error: ${err}`);
        });
});

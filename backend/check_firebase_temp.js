const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore('transen');

async function checkPendingAndTransactions() {
    try {
        console.log("=== PENDING DEPOSITS ===");
        const pendingSnapshot = await db.collectionGroup('pending_deposits').get();
        if (pendingSnapshot.empty) {
            console.log("Aucun dépôt en attente trouvé.");
        } else {
            pendingSnapshot.forEach(doc => {
                const parentUser = doc.ref.parent.parent.id;
                console.log(`User ID: ${parentUser} | Deposit ID: ${doc.id} | Data:`, doc.data());
            });
        }

        console.log("\n=== RECENT DEPOSITS / TRANSACTIONS ===");
        const transSnapshot = await db.collectionGroup('transactions')
            .where('type', '==', 'deposit')
            .orderBy('date', 'desc')
            .limit(20)
            .get();
            
        if (transSnapshot.empty) {
            console.log("Aucune transaction de dépôt trouvée.");
        } else {
            transSnapshot.forEach(doc => {
                const parentUser = doc.ref.parent.parent.id;
                const data = doc.data();
                console.log(`User ID: ${parentUser} | Trans ID: ${doc.id} | Amount: ${data.amount} | Desc: ${data.description} | Date: ${data.date?.toDate()}`);
            });
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

checkPendingAndTransactions();

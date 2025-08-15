import functions from '@google-cloud/functions-framework'
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, Filter} from 'firebase-admin/firestore';
import protobuf from 'protobufjs'
import geofire from "geofire-common"

const app = initializeApp({
  apiKey: "AIzaSyDIEgMvRNVaL_5c2AMc3WlODRIeOzPRCPE",
  authDomain: "realtime-missions.firebaseapp.com",
  projectId: "realtime-missions",
  storageBucket: "realtime-missions.appspot.com",
  messagingSenderId: "449575836563",
  appId: "1:449575836563:web:f29bf68faf15b34d056666",
  measurementId: "G-3TDY6RNM6Y"
});

functions.cloudEvent('updateProfileDBTrigger', async cloudEvent => {
  try {

    const db = await getFirestore(app, 'realtime-missions-db');
    const root = await protobuf.load('data.proto');
    const DocumentEventData = root.lookupType(
      'google.events.cloud.firestore.v1.DocumentEventData'
    );
    
    const firestoreReceived = DocumentEventData.decode(cloudEvent.data);

    let userID = firestoreReceived.value.name.replace("projects/realtime-missions/databases/realtime-missions-db/documents/events/", "")
    const docRef = await db.collection('userProfile').doc(userID);
    const userProfile = await docRef.get();

    const churchRef = await db.collection('church').doc(churchID);
    const church = await docRef.get();

    // duplicate the db entry

    console.log(`Created task ${response.name}`)

  } catch (error) {
    console.error(Error(error.message))
  }
});

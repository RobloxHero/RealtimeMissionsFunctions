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


functions.cloudEvent('locationsUpdateRequest', async cloudEvent => {
  const db = await getFirestore(app, 'realtime-missions-db');
  const root = await protobuf.load('data.proto');
  const DocumentEventData = root.lookupType(
    'google.events.cloud.firestore.v1.DocumentEventData'
  );
  const firestoreReceived = DocumentEventData.decode(cloudEvent.data);

  console.log(JSON.stringify(firestoreReceived.value, null, 2));
  let id = firestoreReceived.value.name.replace("projects/realtime-missions/databases/realtime-missions-db/documents/updateLocationsRequest/", "")
  let lat = Number(firestoreReceived.value.fields.lat.doubleValue)
  let lon = Number(firestoreReceived.value.fields.lon.doubleValue)
  const docRef = await db.collection('updateLocationsRequest').doc(id);
  const userDocRef = await db.collection('usersLocations').doc(id);
  const eventsColRef = await db.collection('events');

  // do a radius check
  
  const center = [lat, lon]
  const radiusInM = 50000;
  const bounds = geofire.geohashQueryBounds(center, radiusInM);

  const promises = [];
  for (const b of bounds) {
    const q = eventsColRef.orderBy('geohash').startAt(b[0]).endAt(b[1])
    promises.push(q.get());
  }
  const snapshots = await Promise.all(promises);

  const locationsNearMe = [];
  for (const snap of snapshots) {
    for (const doc of snap.docs) {
      console.log(doc)
      const lat = doc.get('lat');
      const lng = doc.get('lng');
      const distanceInKm = geofire.distanceBetween([lat, lng], center);
      const distanceInM = distanceInKm * 1000;
      if (distanceInM <= radiusInM) {
        locationsNearMe.push({...doc.data(), eventID: doc.id});
      }
    }
  }

  await userDocRef.set({ locationsNearMe });
  if ((await docRef.get()).exists) {
    await docRef.delete()
  }
});

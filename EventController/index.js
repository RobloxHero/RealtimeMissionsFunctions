import functions from '@google-cloud/functions-framework'
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, Filter } from 'firebase-admin/firestore';
import geofire from "geofire-common"

const functionName = process.env.Function_Name

const app = initializeApp({
  apiKey: "AIzaSyDIEgMvRNVaL_5c2AMc3WlODRIeOzPRCPE",
  authDomain: "realtime-missions.firebaseapp.com",
  projectId: "realtime-missions",
  storageBucket: "realtime-missions.appspot.com",
  messagingSenderId: "449575836563",
  appId: "1:449575836563:web:f29bf68faf15b34d056666",
  measurementId: "G-3TDY6RNM6Y"
});

functions.http('eventController', async (req, res) => {
  try {
    const eventID = req.body.data.split("_")[0]
    const eventType = req.body.data.split("_")[1]
    const db = await getFirestore(app, 'realtime-missions-db');
    const docRef = await db.collection('events').doc(eventID);

    if(eventType == 'start') {
      await docRef.update({eventIsRunning: true})
      res.status(200).send('event started')
    } else {
      await docRef.delete()
      res.status(200).send('event deleted')
    }     
  }
  catch(error){
    res.status(500).send(error)
  }
});



import functions from 'firebase-functions'
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

export const createUser = functions.auth.user().onCreate(async (user) => {
  try {
    const db = await getFirestore(app, 'realtime-missions-db');
    const docRef = await db.collection('userProfile').doc(user.uid);

    await docRef.set({
      emailAddress: user.email, 
      userID: user.uid
    })
    res.status(200).send('event started') 
  }
  catch(error){
    res.status(500).send(error)
  }
});
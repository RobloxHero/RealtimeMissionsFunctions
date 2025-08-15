
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, Filter } from 'firebase-admin/firestore';

const app = initializeApp({
  apiKey: "AIzaSyDIEgMvRNVaL_5c2AMc3WlODRIeOzPRCPE",
  authDomain: "realtime-missions.firebaseapp.com",
  projectId: "realtime-missions",
  storageBucket: "realtime-missions.appspot.com",
  messagingSenderId: "449575836563",
  appId: "1:449575836563:web:f29bf68faf15b34d056666",
  measurementId: "G-3TDY6RNM6Y"
});

import {
  beforeUserSignedIn,
} from "firebase-functions/v2/identity";
import {setGlobalOptions} from 'firebase-functions/v2'

setGlobalOptions({maxInstances: 10})
export const userAuthBeforeSignedIn = beforeUserSignedIn((event) => {
  // TODO
});

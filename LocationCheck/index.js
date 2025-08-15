import functions from '@google-cloud/functions-framework'
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, Filter } from 'firebase-admin/firestore';
import geofire from "geofire-common"
import sharp from 'sharp'
import {Storage} from '@google-cloud/storage'

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

functions.http('location-check', async (req, res) => {
  try {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
      res.set('Access-Control-Max-Age', '3600');
      res.redirect(204);
    } else {
      const body = req.body
      switch (body.requestType) {
        case "addEvent":
          {
            const eventID = body.eventID
            const db = await getFirestore(app, 'realtime-missions-db');
            const docRef = await db.collection('events').doc(eventID);
            const startTime = body.startTime
            const endTime = body.endTime
            const title = body.title
            const userID = body.UserID
            const lat = body.lat
            const lng = body.lng
            const hash = await geofire.geohashForLocation([lat, lng]);
            await docRef.set({
              title,
              endTime,
              startTime,
              geohash: hash,
              lat: lat,
              lng: lng,
              requestType: body.requestType
            });
            res.status(200).send('Event Added');
          }
          case "getEvent":
          {
            const eventID = body.eventID
            const db = await getFirestore(app, 'realtime-missions-db');
            const docRef = await db.collection('events').doc(eventID);
            const event = await docRef.get();
           
            res.status(200).send({...event.data(), eventID: event.id});
          }
          case "getProfile":
          {
            const userID = body.userID
            const db = await getFirestore(app, 'realtime-missions-db');
            const docRef = await db.collection('userProfile').doc(userID);
            const userProfile = await docRef.get();
           
            res.status(200).send({...userProfile.data()});
          }
          case "addImage":
          {
            const imageID = body.name
            const imageData = body.data
            const storage = new Storage()
            const bucket = await storage.bucket('realtime-missions-images')
            const file = await bucket.file(imageID)
            const image = await sharp(imageData).webp().toBuffer()
            const saveRequest = await file.save(image)
            res.status(200).send({name: imageID, data: imageData});
          }
          case "updateProfile":
          {
            const userID = body.userID
            const db = await getFirestore(app, 'realtime-missions-db');
            const docRef = await db.collection('userProfile').doc(userID);
            await docRef.update(body);
            const userProfile = await docRef.get();
           
            res.status(200).send({...userProfile.data()});
          }
          case "addChurch":
          {
            const churchID = body.churchId
            const db = await getFirestore(app, 'realtime-missions-db');
            const docRef = await db.collection('church').doc(churchID);
            const hash = await geofire.geohashForLocation([Number(body.lat), Number(body.lng)]);
            await docRef.set({ ...body, geohash: hash });
            const church = await docRef.get();
            res.status(200).send({...church.data()});
          }
          case "updateChurch":
          {
            const churchID = body.churchID
            const db = await getFirestore(app, 'realtime-missions-db');
            const docRef = await db.collection('church').doc(churchID);
            const hash = await geofire.geohashForLocation([Number(body.lat), Number(body.lng)]);
            await docRef.update({ ...body, geohash: hash });
            const church = await docRef.get();
            res.status(200).send({...church.data()});
          }
        case "addLocation":
          {
            const eventID = body.eventID
            const db = await getFirestore(app, 'realtime-missions-db');
            const docRef = await db.collection('locations').doc(eventID);
            const lat = body.lat
            const lng = body.lng
            const hash = await geofire.geohashForLocation([lat, lng]);
            await docRef.set({
              geohash: hash,
              lat: lat,
              lng: lng
            });
            res.status(200).send('Location Added');
          }
          case "getMyEvents":
            {
              const db = await getFirestore(app, 'realtime-missions-db');
              const colRef = await db.collection('events')
              const userID = body.userID
              const querySnapshot = await colRef.where("userID", "==", userID).get()
              let events = []
              querySnapshot.forEach((doc) => {
                events.push({...doc.data(), eventID: doc.id})
              });
              res.status(200).send({events});
            }
          case "getLocations":
            {
              const db = await getFirestore(app, 'realtime-missions-db');
              const colRef = await db.collection('locations')
              const center = [body.lat, body.lng]
              console.log(center)
              const radiusInM = body.radiusInM;
              console.log(radiusInM)
              const bounds = geofire.geohashQueryBounds(center, radiusInM);

              const promises = [];
              for (const b of bounds) {
                const q = colRef.orderBy('geohash').startAt(b[0]).endAt(b[1])
                promises.push(q.get());
              }

              const snapshots = await Promise.all(promises);

              const matchingDocs = [];
              for (const snap of snapshots) {
                for (const doc of snap.docs) {
                  const lat = doc.get('lat');
                  const lng = doc.get('lng');

                  // We have to filter out a few false positives due to GeoHash
                  // accuracy, but most will match
                  const distanceInKm = geofire.distanceBetween([lat, lng], center);
                  const distanceInM = distanceInKm * 1000;
                  if (distanceInM <= radiusInM) {
                    matchingDocs.push({...doc.data(), eventID: doc.id});
                  }
                }
              }
              res.status(200).send(matchingDocs);
            }
          default :
          {
            res.status(500).send('Request Not Found');
          }
      }
    }
  }
  catch(error){
    console.log(error)
    res.status(500).send(error)
  }
});

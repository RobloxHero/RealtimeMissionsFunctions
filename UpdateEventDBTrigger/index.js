import functions from '@google-cloud/functions-framework'
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, Filter} from 'firebase-admin/firestore';
import protobuf from 'protobufjs'
import geofire from "geofire-common"
import { v2beta3 } from '@google-cloud/tasks'
import moment from "moment"

const app = initializeApp({
  apiKey: "AIzaSyDIEgMvRNVaL_5c2AMc3WlODRIeOzPRCPE",
  authDomain: "realtime-missions.firebaseapp.com",
  projectId: "realtime-missions",
  storageBucket: "realtime-missions.appspot.com",
  messagingSenderId: "449575836563",
  appId: "1:449575836563:web:f29bf68faf15b34d056666",
  measurementId: "G-3TDY6RNM6Y"
});

functions.cloudEvent('updateEventDB', async cloudEvent => {
  try {
    const db = await getFirestore(app, 'realtime-missions-db');
    const root = await protobuf.load('data.proto');
    const DocumentEventData = root.lookupType(
      'google.events.cloud.firestore.v1.DocumentEventData'
    );
    const firestoreReceived = DocumentEventData.decode(cloudEvent.data);

    console.log(JSON.stringify(firestoreReceived.value, null, 2));
    let eventID = firestoreReceived.value.name.replace("projects/realtime-missions/databases/realtime-missions-db/documents/events/", "")
    let startTime = firestoreReceived.value.fields.startTime.stringValue
    let endTime = firestoreReceived.value.fields.endTime.stringValue

    const client = new v2beta3.CloudTasksClient()
    let project = 'realtime-missions'
    let queue = 'realtime-missions-event'
    let location = 'us-east1'
    let cloudTaskRunType = ['start', 'end']
    let url = 'https://us-central1-realtime-missions.cloudfunctions.net/eventController'
    let email = 'realtime-missions-api@realtime-missions.iam.gserviceaccount.com' 
    const parent = client.queuePath(project, location, queue)

    for (let i = 0; i < cloudTaskRunType.length; i++) {
      let payload = JSON.stringify({data: `${eventID}_${cloudTaskRunType[i]}`})
      const body = Buffer.from(payload).toString('base64')

      // get existing cloud task
      // const request = {
      //   name: payload,
      // }
      // const existingCloudTask = await client.getTask(request)

      // // if cloud task exists then delete it
      // if (existingCloudTask.length != 0 && existingCloudTask != null && existingCloudTask == undefined) {
      //   const response = await client.deleteTask(request)
      // }

      // creating new cloud task
      let EventTime = moment( i == 0 ? startTime : endTime ).format('X')
      const task = {
        name: `projects/${project}/locations/${location}/queues/${queue}/tasks/${eventID}_${cloudTaskRunType[i]}`,
        httpRequest: {
          httpMethod: 'POST',
          url,
          oidcToken: {
            serviceAccountEmail: email,
            audience: url,
          },
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        },
      }
      task.scheduleTime = {
        seconds: EventTime, // date in seconds
      }
      const [response] = await client.createTask({parent, task})
      console.log(`Created task ${response.name}`)
    }
  } catch (error) {
    console.error(Error(error.message))
  }
});

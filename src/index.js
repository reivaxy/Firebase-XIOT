
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, onValue, connectDatabaseEmulator } from "firebase/database";


window.signIn = function (email, password) {
   try {
      const firebaseConfig = {
         apiKey: "AIzaSyBBPRQqO4YMb-B6sTBrA6CEQZI-sK9DOE8",
         authDomain: "iotfeeder-22b9b.firebaseapp.com",
         databaseURL: "https://iotfeeder-22b9b-default-rtdb.europe-west1.firebasedatabase.app",
         projectId: "iotfeeder-22b9b",
         storageBucket: "iotfeeder-22b9b.appspot.com",
         messagingSenderId: "646152570331",
         appId: "1:646152570331:web:937c20fa0f9f431ea913fe",
         measurementId: "G-8GH5NST2PV"
      };

      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      // Initialize Firebase Authentication and get a reference to the service
      const auth = getAuth(app);

      setPersistence(auth, browserSessionPersistence)
         .then(() => {
            signInWithEmailAndPassword(auth, email, password)
               .then((userCredential) => {
                  // Signed in 
                  try {
                     const user = userCredential.user;
                     console.log(user.email + " logged in");
                     document.getElementById("login").style.display = 'none';

                     fetchPing();
                  } catch (error) {
                     console.error(error);
                  }

               })
               .catch((error) => {
                  console.error(error);
               });
         });
   } catch (e) {
      console.error(e);
   }
}

let sortByTime = function (a, b) {
   return a.gcp_timestamp < b.gcp_timestamp;
}

window.fetchPing = function () {
   try {
      console.log("fetchPing");
      const dbRef = getDatabase();
      // if (location.hostname === "localhost") {
      //    // Point to the RTDB emulator running on localhost.
      //    connectDatabaseEmulator(dbRef, "localhost", 9000);
      // }
      const refPings = ref(dbRef, 'ping');
      const initModulesDiv = document.getElementById("initModule");
      onValue(refPings, (snapshot) => {
         console.log("Got values");
         const pingData = snapshot.val();
         let modulePings = {};
         for (let ping in pingData) {
            if (!modulePings[pingData[ping].mac]) {
               modulePings[pingData[ping].mac] = [];
            }
            modulePings[pingData[ping].mac].push(pingData[ping]);
         }
         initModulesDiv.innerHTML = "";
         document.getElementById("results").style.display = 'block';
         for (let m in modulePings) {
            const initDiv = document.createElement("div");
            const heapDiv = initDiv.cloneNode(true);
            const initTitle = document.createElement("div");
            initTitle.setAttribute("class", "title");
            initDiv.appendChild(initTitle);
            initTitle.innerHTML = "Restarts";

            initDiv.setAttribute("class", "init");
            heapDiv.setAttribute("class", "heap");
            let pings = modulePings[m];
            let pingInit = [];
            for (let p in pings) {
               let ping = pings[p];
               if (!ping.gcp_timestamp) continue;
               if (ping.init) {
                  pingInit.push(ping);
                  let newPing = document.createElement("div");
                  newPing.innerText = getFormattedDate(ping.gcp_timestamp);
                  initDiv.appendChild(newPing);
               }
            }
            let traceHeap = {
               type: "scatter",
               mode: "lines",
               name: 'Heap Size',
               x: unpackDate(pings, 'gcp_timestamp'),
               y: unpack(pings, 'heap_size'),
               line: { color: '#17BECF' }
            };
            let traceInit = {
               type: "scatter",
               mode: "markers",
               name: 'Module Restart',
               x: unpackDate(pingInit, 'gcp_timestamp'),
               y: unpackInit(pingInit, 'init'),
               line: { color: '#F00' }
            }
            Plotly.newPlot(heapDiv, [traceHeap, traceInit], {
               title: modulePings[m][0].name,
               width: 1024,
               height: 300
            });
            initModulesDiv.appendChild(initDiv);
            initModulesDiv.appendChild(heapDiv);
            initModulesDiv.appendChild(document.createElement("hr"));
         }
      });
   } catch (error) {
      console.error(error);
   }

   window.unpackInit = function (rows, key) {
      return rows.map(function (row) { 
         let init = row[key];
         return init ? row.heap_size : 0; 
      });
   }
   window.unpackDate = function (rows, key) {
      return rows.map(function (row) { 
         let date = getFormattedDate(row[key]).split(' ');
         return date[1]; 
      });
   }
   window.unpack = function (rows, key) {
      return rows.map(function (row) { return row[key]; });
   }

window.getFormattedDate = function (date) {
      let theDate = new Date(date* 1000);
      var month = addZero(theDate.getUTCMonth() + 1);
      var day = addZero(theDate.getUTCDate());
      var hour = addZero(theDate.getUTCHours());
      var min = addZero(theDate.getUTCMinutes());
      var sec = addZero(theDate.getUTCSeconds());
      var dateStr = `${theDate.getUTCFullYear()}/${month}/${day} ${hour}:${min}:${sec} UTC`;
      return dateStr;
   }
   let addZero = function (value) {
      return value < 10 ? "0" + value : value;
   }
}

window.signIn();
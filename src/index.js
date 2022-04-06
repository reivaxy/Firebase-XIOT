
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
            // gcp_timestamp is added by a Firebase function, might not have triggered yet 
            // We'll get the data again when it updates the ping document.
            if (!pingData[ping].gcp_timestamp) continue;

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
               if (ping.init) {
                  pingInit.push(ping);
                  let newPing = document.createElement("div");
                  let initText = getFormattedDate(ping.gcp_timestamp) + (ping.init_reason ? "\n" + ping.init_reason : "");
                  newPing.innerText = initText;
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
               text: unpack(pings, 'init_reason'),
               line: { color: '#F00' }
            };
            let traceFailedMessage = {
               type: "scatter",
               line: { color: "blue"},
               mode: "lines", 
               name: "Failed messages",
               x: unpackDate(pings, 'gcp_timestamp'),
               y: unpack(pings, 'failed_msg'),
               yaxis: "y3"
            };
            let traceLostMessage = {
               type: "scatter",
               line: { color: "orange"},
               mode: "lines", 
               name: "Lost messages",
               x: unpackDate(pings, 'gcp_timestamp'),
               y: unpack(pings, 'lost_msg'),
               yaxis: "y4"
            };
            let traceRetriedMessage = {
               type: "scatter",
               line: { color: "purple"},
               mode: "lines", 
               name: "Retried messages",
               x: unpackDate(pings, 'gcp_timestamp'),
               y: unpack(pings, 'retried_msg'),
               yaxis: "y5"
            };


            let lastPing = modulePings[m][modulePings[m].length -1 ]
            let lang = lastPing.lang || "en"
            let layout = {
               title: lastPing.name,
               width: 1500,
               height: 300,
               xaxis: {
                  tickformat: "%H:%M:%S",
                  tickangle: "90",
                  dtick: 1800000                 
               },
               yaxis3: {
                  color: "blue",
                  side: "right",
                  overlaying: "y",
                  range: [0, 20]
               },
               yaxis4: {
                  color: "orange",
                  side: "right",
                  overlaying: "y",
                  range: [0, 20]
               },
               yaxis5: {
                  color: "purple",
                  side: "right",
                  overlaying: "y",
                  range: [0, 20]
               }
            };
            let config = {
               displayModeBar: true,
               locale: lang
            };

            Plotly.newPlot(heapDiv, [traceHeap,  traceInit, traceFailedMessage, traceLostMessage, traceRetriedMessage], layout, config);
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
         let date = getFormattedDate(row[key]);
         return date; 
      });
   }
   window.unpack = function (rows, key) {
      return rows.map(function (row) { return row[key] || 0; });
   }

window.getFormattedDate = function (date) {
      let theDate = new Date(date* 1000);
      var month = addZero(theDate.getUTCMonth() + 1);
      var day = addZero(theDate.getUTCDate());
      var hour = addZero(theDate.getUTCHours());
      var min = addZero(theDate.getUTCMinutes());
      var sec = addZero(theDate.getUTCSeconds());
      var dateStr = `${theDate.getUTCFullYear()}-${month}-${day}T${hour}:${min}:${sec}`;
      return dateStr;
   }
   let addZero = function (value) {
      return value < 10 ? "0" + value : value;
   }
}

window.signIn();
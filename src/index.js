
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, onValue, connectDatabaseEmulator } from "firebase/database";

window.selectedM = '';
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
      let auth = getAuth(app);
      setPersistence(auth, browserSessionPersistence)
         .then(() => {
            signInWithEmailAndPassword(auth, email, password)
               .then((userCredential) => {
                  // Signed in 
                  try {
                     const user = userCredential.user;
                     console.log(user.email + " logged in");
                     document.getElementById("login").style.display = 'none';
                     fetchData();
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

window.fetchData = function () {
   try {
      console.log("fetchData");
      const dbRef = getDatabase();
      // if (location.hostname === "localhost") {
      //    // Point to the RTDB emulator running on localhost.
      //    connectDatabaseEmulator(dbRef, "localhost", 9000);
      // }
      const refModules = ref(dbRef, '/module');
      onValue(refModules, (snapshot) => {
         window.modules = {};
         const moduleData = snapshot.val();
         for (let mac in moduleData) {
            modules[mac] = moduleData[mac];
         }
      });

      const refALerts = ref(dbRef, '/alert');
      onValue(refALerts, (snapshot) => {
         window.moduleAlerts = {};
         window.processModuleData(snapshot, window.moduleAlerts) 
      });

      const refLogs = ref(dbRef, '/log');
      onValue(refLogs, (snapshot) => {
         window.moduleLogs = {};
         window.processModuleData(snapshot, window.moduleLogs);
      });

      const refPings = ref(dbRef, '/ping');
      onValue(refPings, (snapshot) => { 
         window.modulePings = {};
         window.processModuleData(snapshot, window.modulePings);
         window.displayTabs();
       });

      

   } catch (error) {
      console.error(error);
   }
}

window.processModuleData = function (snapshot, hashMap) {
   //console.log("Got values");
   const eventData = snapshot.val();
   //console.log(pingData);
   for (let evt in eventData) {
      // console.log(pingData[ping]);
      // gcp_timestamp is added by a Firebase function, might not have triggered yet 
      // We'll get the data again when it updates the ping document.
      if (!eventData[evt].gcp_timestamp) continue;

      if (!hashMap[eventData[evt].mac]) {
         hashMap[eventData[evt].mac] = [];
      }
      hashMap[eventData[evt].mac].push(eventData[evt]);
   }

}

window.selectTab = function (evt) {
   let sourceElt = evt.target;
   let m = sourceElt.getAttribute('m');
   let previousM = '';
   if (m) {
      window.selectedM = m
      let previousSelectedTab = document.querySelector("li.selected");
      if (previousSelectedTab) {
         previousSelectedTab.className = '';
         previousM = previousSelectedTab.getAttribute('m');
      }
      let newSelectedTab = document.getElementById(`tab-${m}`);
      newSelectedTab.className = "selected";
      let previousSelectedPanel = document.getElementById(`panel-${previousM}`);
      if (previousSelectedPanel) {
         previousSelectedPanel.style.display = 'none';
      }
      let newSelectedPanel = document.getElementById(`panel-${m}`);
      newSelectedPanel.style.display = 'block';
   }

}

window.addTitle = function(domElt, title) {
   const titleDiv = document.createElement("div");
   titleDiv.setAttribute("class", "title");
   domElt.appendChild(titleDiv);
   titleDiv.innerHTML = title;
   domElt.setAttribute("class", "list");
}
window.displayTabs = function () {
   console.log("displayTabs");
   let modules = window.modules;
   let modulePings = window.modulePings;
   let moduleAlerts = window.moduleAlerts;
   let moduleLogs = window.moduleLogs;
   const moduleTabsDiv = document.getElementById("moduleTabs");
   moduleTabsDiv.innerHTML = '<ul id="tabs"></ul>';
   const tabsUl = document.getElementById("tabs");
   document.getElementById("results").style.display = 'block';
   for (let m in modules) {
      let oneTabLi = document.createElement("li");
      oneTabLi.setAttribute("id", `tab-${m}`);
      oneTabLi.setAttribute("m", `${m}`);
      oneTabLi.innerHTML = `<span m="${m}">${modules[m].name}</span>`;

      tabsUl.appendChild(oneTabLi);

      let onePanelDiv = document.createElement("div");
      onePanelDiv.setAttribute("id", `panel-${m}`);
      moduleTabsDiv.appendChild(onePanelDiv);
      onePanelDiv.className = "panel";
      if (window.selectedM == '' || window.selectedM == m) {
         window.selectedM = m;
         oneTabLi.className = "selected";
      } else {
         onePanelDiv.style.display = 'none';
      }
   }

   for (let m in modulePings) {
      const initDiv = document.createElement("div");
      const alertDiv = document.createElement("div");
      const logDiv = document.createElement("div");
      const heapDiv = document.createElement("div");

      window.addTitle(initDiv, "Restarts");
      window.addTitle(alertDiv, "Alerts");
      window.addTitle(logDiv, "Logs");
      heapDiv.setAttribute("class", "heap");

      let pings = modulePings[m];
      let pingInit = [];
      for (let p in pings) {
         let ping = pings[p];
         if (ping.init) {
            pingInit.push(ping);
            let newPing = document.createElement("div");
            let initText = getFormattedDate(ping.gcp_timestamp) + (ping.init_reason ? ": " + ping.init_reason : "");
            newPing.innerText = initText;
            initDiv.appendChild(newPing);
         }
      }

      let alerts = moduleAlerts[m];
      for (let a in alerts) {
         let alert = alerts[a];
         let newAlert = document.createElement("div");
         let initText = getFormattedDate(alert.gcp_timestamp) + ": " + alert.message;
         newAlert.innerText = initText;
         alertDiv.appendChild(newAlert);
         
      }  

      let logs = moduleLogs[m];
      for (let l in logs) {
         let log = logs[l];
         let newLog = document.createElement("div");
         let initText = getFormattedDate(log.gcp_timestamp) + ": " + log.message + (log.quantity ? ` de quantité: ${log.quantity}` : "");
         newLog.innerText = initText;
         logDiv.appendChild(newLog);
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
         line: { color: "blue" },
         mode: "lines",
         name: "Failed messages",
         x: unpackDate(pings, 'gcp_timestamp'),
         y: unpack(pings, 'failed_msg'),
         yaxis: "y3"
      };
      let traceLostMessage = {
         type: "scatter",
         line: { color: "orange" },
         mode: "lines",
         name: "Lost messages",
         x: unpackDate(pings, 'gcp_timestamp'),
         y: unpack(pings, 'lost_msg'),
         yaxis: "y4"
      };
      let traceRetriedMessage = {
         type: "scatter",
         line: { color: "purple" },
         mode: "lines",
         name: "Retried messages",
         x: unpackDate(pings, 'gcp_timestamp'),
         y: unpack(pings, 'retried_msg'),
         yaxis: "y5"
      };


      let lastPing = modulePings[m][modulePings[m].length - 1]
      let lang = lastPing.lang || "en"
      let layout = {
         title: lastPing.name + "<br>(version " + modules[modulePings[m][0].mac].version + ")",
         width: 1500,
         height: 300,
         xaxis: {
            tickformat: "%H:%M:%S",
            tickangle: "90",
            nticks: 100,
            tickmode: "auto"
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

      Plotly.newPlot(heapDiv, [traceHeap, traceInit, traceFailedMessage, traceLostMessage, traceRetriedMessage], layout, config);
      let moduleDiv = document.getElementById(`panel-${m}`);
      moduleDiv.appendChild(heapDiv);
      moduleDiv.appendChild(initDiv);
      moduleDiv.appendChild(alertDiv);
      moduleDiv.appendChild(logDiv);
   }

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
   let theDate = new Date(date * 1000);
   var month = addZero(theDate.getUTCMonth() + 1);
   var day = addZero(theDate.getUTCDate());
   var hour = addZero(theDate.getUTCHours());
   var min = addZero(theDate.getUTCMinutes());
   var sec = addZero(theDate.getUTCSeconds());
   var dateStr = `${theDate.getUTCFullYear()}-${month}-${day} ${hour}:${min}:${sec}`;
   return dateStr;
}
let addZero = function (value) {
   return value < 10 ? "0" + value : value;
}


window.signIn();
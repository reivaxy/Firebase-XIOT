
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, child, get, onValue } from "firebase/database";

window.selectedM = '';
window.signIn = function (email, password) {
   try {
      window.onError = function() {
         document.body.style.backgroundColor = "red";
      }
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
   document.getElementById('refresh').hidden = true;
   try {
      console.log("fetchData");
      const db = getDatabase();
      const dbRef = ref(db);
      // if (location.hostname === "localhost") {
      //    // Point to the RTDB emulator running on localhost.
      //    connectDatabaseEmulator(dbRef, "localhost", 9000);
      // }
      // const refModules = ref(db, '/module');
      // onValue(refModules, (snapshot) => {
      get(child(dbRef, '/module')).then((snapshot) => {
         window.modules = [];

         const moduleData = snapshot.val();
         for (let mac in moduleData) {
            window.modules.push(moduleData[mac]);
         }
         window.modules.sort((a, b) => {
            return (a.name.localeCompare(b.name));
         })

      }).then(function() {

         // const refALerts = ref(db, '/alert');
         // onValue(refALerts, (snapshot) => {
         get(child(dbRef, '/alert')).then((snapshot) => {
            window.moduleAlerts = {};
            window.processModuleData(snapshot, window.moduleAlerts, 'alert') 
         });
      }).then(function() {
         // const refLogs = ref(db, '/log');
         // onValue(refLogs, (snapshot) => {
         get(child(dbRef, '/log')).then((snapshot) => {
            window.moduleLogs = {};
            window.processModuleData(snapshot, window.moduleLogs, 'log');
         });
      }).then(function() {
         // const refPings = ref(db, '/ping');
         // onValue(refPings, (snapshot) => { 
         get(child(dbRef, '/ping')).then((snapshot) => {
            window.modulePings = {};
            window.processModuleData(snapshot, window.modulePings, 'ping');
            window.displayTabs();
         });     
      }).catch(error => {
         if(error) {
            alert(error);
         }
         
      }).finally( e => {
         document.getElementById('refresh').hidden = false;
      });

   } catch (error) {
      console.error(error);
   }
}

window.processModuleData = function (snapshot, hashMap, type) {
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
      // The disconnection alerts can't have the heap_max_block_size field and we don't want 
      if (type == 'alert') {
         if (undefined == eventData[evt].heap_max_block_size) {
            eventData[evt].heap_max_block_size = window.previousAlertMaxHeapBlock;
         } else {
            window.previousAlertMaxHeapBlock = eventData[evt].heap_max_block_size;
         }
      }
      hashMap[eventData[evt].mac].push(eventData[evt]);
   }

}

window.selectTabByEvent = function (evt) {
   let sourceElt = evt.target;
   let m = sourceElt.getAttribute('m');
   if (m) {
      window.selectTabByMac(m);
      let name = sourceElt.innerText;
      document.title = name;
   }

   
}
window.selectTabByMac = function (m) {
   document.location.href=document.location.origin + '#' + m;
   let previousM = '';
   if (m) {
      window.selectedM = m;
      let previousSelectedTab = document.querySelector("li.selected");
      if (previousSelectedTab) {
         previousSelectedTab.className = '';
         previousM = previousSelectedTab.getAttribute('m');
      }
      let newSelectedTab = document.getElementById(`tab-${m}`);
      if (!newSelectedTab) {
         m = window.modules[0].mac;
         newSelectedTab = document.getElementById(`tab-${m}`);
      }
      newSelectedTab.className = "selected";
      let previousSelectedPanel = document.getElementById(`panel-${previousM}`);
      if (previousSelectedPanel) {
         previousSelectedPanel.style.display = 'none';
         previousSelectedPanel.className = "panel";
      }
      let newSelectedPanel = document.getElementById(`panel-${m}`);
      newSelectedPanel.style.display = 'block';
      newSelectedPanel.className = "panel selected";
   }

}

window.addListTitle = function(domElt, title) {
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
   console.log("Hash: " + document.location.hash);
   window.selectedM = document.location.hash.replace('#', '');
   
   for (let i = 0 ; i < modules.length; i ++) {
      let m = modules[i].mac;
      let oneTabLi = document.createElement("li");
      oneTabLi.setAttribute("id", `tab-${m}`);
      oneTabLi.setAttribute("m", `${m}`);
      oneTabLi.innerHTML = `<span m="${m}">${modules[i].name}</span>`;

      tabsUl.appendChild(oneTabLi);

      let onePanelDiv = document.createElement("div");
      onePanelDiv.setAttribute("id", `panel-${m}`);
      moduleTabsDiv.appendChild(onePanelDiv);
      onePanelDiv.className = "panel";
      onePanelDiv.style.display = 'none';

      const initDiv = document.createElement("div");
      const alertDiv = document.createElement("div");
      const logDiv = document.createElement("div");
      const heapDiv = document.createElement("div");

      window.addListTitle(initDiv, "Restarts");
      window.addListTitle(alertDiv, "Alerts");
      window.addListTitle(logDiv, "Logs");
      heapDiv.setAttribute("class", "heap");
      const logFilter = document.createElement("div");
      logFilter.className = "topRightCorner";
      logFilter.innerHTML = '<input type="checkbox" onclick="window.filterLogs(event)"/><span>Only show food logs</span>';
      logDiv.appendChild(logFilter);
      logDiv.className = "logs list";

      let pings = modulePings[m];
      let pingInits = [];
      for (let p in pings) {
         let ping = pings[p];
         if (ping.init) {
            pingInits.push(ping);
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
         // Set a specific class on non food distribution logs to be able to filter them out
         if (!log.quantity) {
            newLog.className = "nofoodlog"
         }
         logDiv.appendChild(newLog);
      }      

      window.logMinHeapBlockLog = 100000;
      window.maxHeap = 37000;
      let traceHeap = {
         type: "scatter",
         mode: "lines",
         name: 'Heap Size',
         x: unpackDate(pings, 'gcp_timestamp'),
         y: unpack(pings, 'heap_size'),
         hovertemplate: unpackHover(pings, "%{x|%Y-%m-%d %H:%M:%S}<br>%{y}", "none"),
         line: { color: '#17BECF' }
      };
      let traceHeapMaxBlock = {
         type: "scatter",
         mode: "lines",
         name: 'Pings Max Bloc Size',
         x: unpackDate(pings, 'gcp_timestamp'),
         y: unpackSaveMin(pings, 'heap_max_block_size'),
         hovertemplate: unpackHover(pings, "%{x|%Y-%m-%d %H:%M:%S}<br>%{y}", "none"),
         line: { color: '#47a1ad' }
      };

      let traceHeapMaxBlockLogs = {
         type: "scatter",
         line: { color: "#6da8b0" },
         mode: "lines+markers",
         name: "Logs Max Bloc Size",
         x: unpackDate(logs, 'gcp_timestamp'),
         y: unpackSaveMin(logs, 'heap_max_block_size'),
         hovertemplate: unpackHover(logs, "%{x|%Y-%m-%d %H:%M:%S}<br>%{y}", "none")
      };

      let traceHeapMaxBlockAlerts = {
         type: "scatter",
         line: { color: "#8fb5ba" },
         mode: "lines+markers",
         name: "Alerts Max Bloc Size",
         x: unpackDate(alerts, 'gcp_timestamp'),
         y: unpackSaveMin(alerts, 'heap_max_block_size'),
         hovertemplate: unpackHover(alerts, "%{x|%Y-%m-%d %H:%M:%S}<br>%{y}", "none")
         
      };


      let traceInit = {
         type: "scatter",
         mode: "markers",
         name: 'Module Restart',
         x: unpackDate(pingInits, 'gcp_timestamp'),
         y: unpackInit(pingInits, 'init'),
         hovertemplate: unpackHover(pingInits, "%{x|%Y-%m-%d %H:%M:%S}", "init_reason"),
         line: { color: '#F00' }

      };
      if (window.logMinHeapBlockLog < 100000) {
         traceInit.error_y = {
            array: unpackInitMinus(pingInits, 'init'),
            color: "red",
            symmetric: false
         }
      }

      let traceFailedMessage = {
         type: "scatter",
         line: { color: "blue" },
         mode: "lines",
         name: "Failed messages",
         x: unpackDate(pings, 'gcp_timestamp'),
         y: unpack(pings, 'failed_msg'),
         hovertemplate: unpackHover(pings, "%{x|%Y-%m-%d %H:%M:%S}<br>%{y}", "none"),
         yaxis: "y3"
      };
      let traceLostMessage = {
         type: "scatter",
         line: { color: "orange" },
         mode: "lines",
         name: "Lost messages",
         x: unpackDate(pings, 'gcp_timestamp'),
         y: unpack(pings, 'lost_msg'),
         hovertemplate: unpackHover(pings, "%{x|%Y-%m-%d %H:%M:%S}<br>%{y}", "none"),
         yaxis: "y4"
      };
      let traceRetriedMessage = {
         type: "scatter",
         line: { color: "purple" },
         mode: "lines",
         name: "Retried messages",
         x: unpackDate(pings, 'gcp_timestamp'),
         y: unpack(pings, 'retried_msg'),
         hovertemplate: unpackHover(pings, "%{x|%Y-%m-%d %H:%M:%S}<br>%{y}", "none"),
         yaxis: "y5"
      };

      let lang = "en";
      if (modulePings[m]) {
         let lastPing = modulePings[m][modulePings[m].length - 1]
         lang = lastPing.lang || "en"
      }
      let layout = {
         title: modules[i].name,
         width: 1500,
         height: 400,
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

      let traces = [traceHeap, traceInit, traceFailedMessage, traceLostMessage, traceRetriedMessage];
      if (modules[i].heap_max_block_size) {
         // problem with alerts is that disconnection alerts do not have info on heap size => 0 => ruins autoscaling
         traces.unshift(traceHeapMaxBlockAlerts);

         traces.unshift(traceHeapMaxBlockLogs);
         traces.unshift(traceHeapMaxBlock);
      }
      Plotly.newPlot(heapDiv, traces, layout, config);
      let moduleDiv = document.getElementById(`panel-${m}`);

      let infoDiv = document.createElement("div");
      infoDiv.innerHTML =  "Name: " + modules[i].name 
                           + "<br>Type: " + modules[i].type
                           + "<br>Firmware version: " + modules[i].version 
                           + "<br>Firmware language: " + modules[i].lang
                           + "<br>Local IP: <a target=_new href='http://" + modules[i].ip + "'>" + modules[i].ip + "</a>"
                           + "<br>Mac address: " + modules[i].mac
                           + "<br>Pushover config: " + (modules[i].ta != undefined && modules[i].tu != undefined)
                           + "<br>IR detector: " + modules[i].with_ir;
                           
      moduleDiv.appendChild(heapDiv);
      moduleDiv.appendChild(infoDiv);
      moduleDiv.appendChild(initDiv);
      moduleDiv.appendChild(alertDiv);
      moduleDiv.appendChild(logDiv);
   }

   if (window.selectedM != '') {
      window.selectTabByMac(window.selectedM);
   }

   // If no module selected, select the first one
   // this happens when the url hash does not match a module
   if (document.querySelector("li.selected") == null) {
      window.selectTabByMac(modules[0].mac);
   }

}

window.filterLogs = function(evt) {
   let logsDiv = document.querySelector("div.panel.selected div.logs");
   let className = logsDiv.className;
   if (className.indexOf(" filter") != -1) {
      className = className.replace(" filter", "");
   } else {
      className = `${className} filter`;
   }
   logsDiv.className = className;
}

window.unpackHover = function (rows, format, field) {
   if (!rows) return [];
   return rows.map(function (row) {
      let result = format;
      if (row[field]) {
         result += '<br>' + row[field];
      } 
      return result;
   });   
}

window.unpackInit = function (rows, key) {
   if (!rows) return [];
   return rows.map(function (row) {
      let init = row[key];
      return init ? window.maxHeap: 0;
   });
}
window.unpackInitMinus = function (rows, key) {
   if (!rows) return [];
   return rows.map(function (row) {
      let init = row[key];
      return init ? window.logMinHeapBlockLog - window.maxHeap : 0;
   });
}
window.unpackDate = function (rows, key) {
   if (!rows) return [];
   return rows.map(function (row) {
      let date = getFormattedDate(row[key]);
      return date;
   });
}
window.unpack = function (rows, key) {
   if (!rows) return [];
   return rows.map(function (row) { return row[key] || 0; });
}

window.unpackSaveMin = function (rows, key) {
   if (!rows) return [];
   return rows.map(function (row) { 
      if (row[key] && row[key] < window.logMinHeapBlockLog) {
         window.logMinHeapBlockLog = row[key];
      }
      return row[key] || 0; 
   });
}

window.getFormattedDate = function (date) {
   let theDate = new Date(date * 1000);
   var month = addZero(theDate.getMonth() + 1);
   var day = addZero(theDate.getDate());
   var hour = addZero(theDate.getHours());
   var min = addZero(theDate.getMinutes());
   var sec = addZero(theDate.getSeconds());
   var dateStr = `${theDate.getFullYear()}-${month}-${day} ${hour}:${min}:${sec}`;
   return dateStr;
}
let addZero = function (value) {
   return value < 10 ? "0" + value : value;
}


window.signIn();
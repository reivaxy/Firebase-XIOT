
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

let fetchPing = function () {
   try {
      const dbRef = getDatabase();
      // if (location.hostname === "localhost") {
      //    // Point to the RTDB emulator running on localhost.
      //    connectDatabaseEmulator(dbRef, "localhost", 9000);
      // }
      const refPings = ref(dbRef, 'ping');
      const pingInitModule = document.getElementById("initmodule");
      onValue(refPings, (snapshot) => {
         const data = snapshot.val();
         //console.log(data);
         pingInitModule.innerHTML = "";
         let modulePings = {};
         for (let ping in data) {
            if (!modulePings[data[ping].mac]) {
               modulePings[data[ping].mac] = [];
            }
            modulePings[data[ping].mac].push(data[ping]);
         }
         document.getElementById("results").style.display = 'block';
         for (let m in modulePings) {
            const moduleDiv = document.createElement("div"); 
            const moduleTitle = document.createElement("div"); 
            moduleTitle.setAttribute("class", "title");
            moduleDiv.appendChild(moduleTitle);
            moduleTitle.innerHTML = modulePings[m][0].name;
            moduleDiv.setAttribute("class", "module");
            let pings = modulePings[m];
            for (let p in pings) {
               let ping = pings[p];
               if(!ping.gcp_timestamp) continue;
               if (ping.init) {
                  let newPing = document.createElement("div");
                  let date = new Date(ping.gcp_timestamp * 1000);
                  newPing.innerText = getFormattedDate(date);
                  moduleDiv.appendChild(newPing);
               }
               
            }
            pingInitModule.appendChild(moduleDiv);
         }
      });
   } catch (error) {
      console.error(error);
   }

   let getFormattedDate = function (theDate) {
      var month = addZero(theDate.getUTCMonth()+ 1) ;
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
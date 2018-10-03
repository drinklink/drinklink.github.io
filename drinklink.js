      var map;
      function initMap() {
        finder_iterator = -1;
        userMarkersAr = [];
        locats = null;
        var directionsService = new google.maps.DirectionsService;
        var directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers:true});
        var geocoder = new google.maps.Geocoder();

        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: -36.8485, lng: 174.7633}, //Auckland
          zoom: 11
        });
        getUserLocation();
        getPlaces();

        directionsDisplay.setMap(map);

        var onChangeHandler = function(){
            //findNext();
            document.getElementById("findNearest").innerHTML = "NEXT NEAREST";
            if(finder_iterator < 4){
            finder_iterator++;
            }
            calculateandDisplayRoute(directionsService,directionsDisplay,finder_iterator);
            };

        document.getElementById("setLocation").addEventListener("click",function(){geocodeaddress(geocoder,map)});
        document.getElementById("findNearest").addEventListener("click",onChangeHandler);

        setTimeout(function(){
            var intromain=document.getElementById('intro-main');
            intromain.parentNode.removeChild(intromain);
            var introel=document.getElementById('intro');
            introel.parentNode.removeChild(introel);
            document.getElementsByTagName("body")[0].setAttribute("class","loaded");
        },3000);

      setTimeout(function(){
            var wrapper=document.getElementById('loader-wrapper');
            wrapper.parentNode.removeChild(wrapper);
        },4000);

      }



      function setMarkers(places){

        //Set up a dummy content window object
        var contentString = 'temp';
        var infowindow = new google.maps.InfoWindow({
          content: contentString
          });

        //Place the markers on the map
        for(var i=0;i<places.length;i++){
          //console.log(places[i]);
          var marker = new google.maps.Marker({
            position:{lat:places[i].lat,lng:places[i].lng},
            map: map,
            title: places[i].name,
            html: "<h2>"+places[i].name+"</h2><p>"+places[i].address+"</p><p>"+places[i].type+"</p>"
            });

          //Add info window to the marker
          google.maps.event.addListener(marker, "click",function(){
              infowindow.setContent(this.html);
              infowindow.open(map,this);
            });

        }


      }

      function getPlaces(){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(){
          if (xhttp.readyState == 4 && xhttp.status == 200){
            storeLocations =  JSON.parse(xhttp.responseText)
            setMarkers(storeLocations);
          }
        };
        xhttp.open("GET","/places-now.json",true);
        xhttp.send();
      }


      function getUserLocation(){
        if(navigator.geolocation){
          navigator.geolocation.getCurrentPosition(showPosition);
        } else{
          //Geolocation not supported
          alert("No geolocation, try entering your location manually");
        }
      }

      function cleanupOld(){
        if(userMarkersAr.length> 0){
            var m = userMarkersAr[0];
            m.setMap(null);
            userMarkersAr = [];
        }

       }

      function showPosition(position,manual){
        finder_iterator = -1;
        cleanupOld();
        locats = null;
        var image = "/beachflag.png";
        if (manual !== true){
            userPos = {lat:position.coords.latitude,lng:position.coords.longitude};
        } else{
            userPos = {lat:position.lat(), lng:position.lng()};
        }


        var userMarker = new google.maps.Marker({
          position:userPos,
          map: map,
          title: "That's me!",
          icon:image
        });
        userMarkersAr.push(userMarker);

        var myContent = "You are here";
        var myinfowindow = new google.maps.InfoWindow({
          content: myContent
        });

        myinfowindow.open(map,userMarker);
        map.setCenter(userPos);
        map.setZoom(15);

        //userMarker.click();
      }


      function findNearest(){
         //Reset this incase of multiple lookups for different addresses
        //console.log(JSON.stringify(userPos));
        min = 9999;
        max = 10000;
        var distances = [];
        var closest = [null,null,null,null,null]; //array of nearest
        for(var i=0;i<storeLocations.length;i++){
            dist = getDistanceFromLatLonInKm(userPos.lat,userPos.lng,storeLocations[i].lat,storeLocations[i].lng);
            sl = storeLocations[i]
            sl.dist = dist;
            distances.push(sl)

            //New shortest
            if(dist < min){
                min = dist;
                closest.splice(0,0,sl)
                closest.pop();
                //console.log(closest);
            }

            else if(dist > min && dist <= max){ //One of the new top 5
                for(var j=0;j<closest.length;j++){
                    if(closest[j] == null){
                        //populate the initial array
                        closest.splice(j,0,sl)
                        closest.pop();
                    }

                    else if(dist < closest[j].dist){
                        closest.splice(j,0,sl)
                        closest.pop();

                        if(closest[closest.length-1] != null && closest[closest.length-1].dist<max){
                            //if the last place is the new max
                            max=closest[closest.length-1].dist;
                        }

                        //console.log(closest);
                        break;

                    }
                }
            }
            //Else the location is too far away
            //console.log(closest);
        }
        //alert(JSON.stringify(closest[4]))
        //console.log(JSON.stringify(closest));
        locats = closest;
      }

      function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
          var R = 6371; // Radius of the earth in km
          var dLat = deg2rad(lat2-lat1);  // deg2rad below
          var dLon = deg2rad(lon2-lon1);
          var a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
            ;
          var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          var d = R * c; // Distance in km
          return d;
        }

        function deg2rad(deg) {
          return deg * (Math.PI/180)
        }

      function geocodeaddress(geocoder, resultsMap) {
          var address = document.getElementById('locationText').value;
          if(address == ""){
            return false;
          }

          geocoder.geocode({'address': address, componentRestrictions: {country: 'NZ'}}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              showPosition(results[0].geometry.location, true);
            } else {
              alert('Geocode was not successful for the following reason: ' + status);
            }
          });
      }

      function showDestMarker(directionResult,storeEl){
        var glassIcon = "/glass.png";


        var Destmarker = new google.maps.Marker({
            position: directionResult.routes[0].legs[0].end_location,
            map: map,
            icon: glassIcon
        });
        var stepDisplay = new google.maps.InfoWindow();
        google.maps.event.addListener(Destmarker,'click', function(){
            stepDisplay.open(map,Destmarker);
        });
        stepDisplay.setContent("<b>"+storeEl.name+"</b>");
        stepDisplay.open(map,Destmarker);
      }

      function calculateandDisplayRoute(directionsService,directionsDisplay,finder_iterator){
            //alert(userPos);
            if(locats == null){
                findNearest();
            }
            directionsService.route({
                origin: userPos,
                destination: {lat:locats[finder_iterator].lat, lng:locats[finder_iterator].lng},
                travelMode: google.maps.TravelMode.WALKING
            }, function(response,status){
            if (status === google.maps.DirectionsStatus.OK){
                directionsDisplay.setDirections(response);
                showDestMarker(response,locats[finder_iterator]);

                }
            else{
                window.alert('Directions request failed due to ' + status);
            }
            });

      }

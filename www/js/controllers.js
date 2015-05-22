angular.module('starter.controllers', [])

.controller('FavoritesCtrl', function($scope, $q, Favorites) {

    Favorites.get().then(function(data) {    	
        var favorites = [];
        for(i=0;i<data.length;i++) {
          likes = data[i].likes.split(",");
          favorites.push({name: data[i].name, likes: likes, photo: data[i].photo});
          if(data[i].currentUser == true)
            $scope.currentUser = data[i].name;
        }
        $scope.favorites = favorites;
        console.log("Current User is: " + $scope.currentUser);
    });

    $scope.doRefresh = function() {
      Favorites.get().then(function(data) {
        var favorites = [];
        for(i=0;i<data.length;i++) {
          likes = data[i].likes.split(",");
          favorites.push({name: data[i].name, likes: likes, photo: data[i].photo});
          if(data[i].currentUser == true)
            $scope.currentUser = data[i].name;
        }
        $scope.favorites = favorites;
        console.log("Current User is: " + $scope.currentUser);
      });
      $scope.$broadcast('scroll.refreshComplete');
    };

    $scope.deleteLike = function(currentUser, likes, like) {
      Favorites.delete(currentUser + "@slalom.com", likes, like).then(function(data) {
        console.log("Jai Shri Ram");
        console.log(data);
        if(data == false) { $scope.doRefresh(); }
      });
    }
})

.controller('RestaurantsCtrl', function($scope, $http, $q, $ionicLoading, $ionicPopup, $state, Favorites) {

  //Calculate distance between two coordinates
  function calcDistance(destination){
    var p1 = new google.maps.LatLng(destination.A, destination.F);
    var p2 = new google.maps.LatLng($scope.position.latitude, $scope.position.longitude);
    return (google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000 * 0.621371).toFixed(2);
  }

  function initialize() { 
    $ionicLoading.show({
      templateUrl: "templates/spinner.html"
    });

    //Get current location
    navigator.geolocation.getCurrentPosition(function(position) {
      $scope.position = position.coords;
      console.log("Position:");
      console.log(position.coords.longitude);
      var map;
      var service;
      var infowindow;

      //Slalom ATL location: 33.85, -84.35
      //PlaceService.nearBySearch
      var currLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      map = new google.maps.Map(document.getElementById('map'));
      var request = {
        location: currLocation,
        //radius: '1000',
        types: ['restaurant'],
        rankBy: google.maps.places.RankBy.DISTANCE
      };
      service = new google.maps.places.PlacesService(map);
      service.nearbySearch(request, callback);

      function callback(results, status, pagination) {
          if (status != google.maps.places.PlacesServiceStatus.OK) {
            console.log(status);
            return;
          }
          for(i=0;i<1;i++) {
            for (var i = 0; i < results.length; i++) {
              restaurants.push(results[i]);
              distance.push(calcDistance(results[i].geometry.location) + " miles away"); 
            }
            if(!pagination.hasNextPage) {
              $scope.$apply(function() {
                $scope.restaurants = restaurants;
                $scope.distance = distance;
                 $ionicLoading.hide();
              });
              break;
            }
            pagination.nextPage();
          }
        }

        //Google Autocomplete
        var geolocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var input = (document.getElementById('searchText'));
        var circle = new google.maps.Circle({center: geolocation, radius: position.coords.accuracy});
        var autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.setBounds(circle.getBounds());
        autocomplete.bindTo('bounds', map);
        google.maps.event.addListener(autocomplete, 'place_changed', function() {
          var place = autocomplete.getPlace();
          $scope.$apply(function() {
            $scope.restaurants.unshift(place);
            $scope.distance.unshift(calcDistance(place.geometry.location) + " miles away");
          })
        });
      }, function(error) {
        console.log("error");
        console.log(JSON.stringify(error));
      });
  }

  restaurants = [];
  distance = []; 
  initialize();

  $scope.choose = function(restaurant) {
    Favorites.choose(restaurant);
     var alertPopup = $ionicPopup.alert({
     	title: 'Thank You',
     	templateUrl: 'templates/like-confirmation.html'
     });
  }

  $scope.hide = function(restaurant) {
    var index = $scope.restaurants.indexOf(restaurant);
    if(index > -1) {
        $scope.restaurants.splice(index,1);
        $scope.distance.splice(index,1);
    }
  }

  $scope.clearSearchText = function() {
    document.getElementById('searchText').value = "";
    $scope.searchText="";
    document.getElementById('searchText').blur();
  }

  $scope.closeKeyboard = function() {
    $scope.clearSearchText();
    window.cordova.plugins.Keyboard.close();
  }

  $scope.disableTap = function() {
    container = document.getElementsByClassName('pac-container');
    angular.element(container).attr('data-tap-disabled', 'true');
    angular.element(container).on("click", function(){
        document.getElementById('searchText').blur();
    });
  }  

  $scope.doRefresh = function() {
    $scope.restaurants = [];
    $scope.distance = [];
    restaurants = [];
    distance = []; 
    initialize();
    $scope.$broadcast('scroll.refreshComplete');
  };
})

.controller('RestaurantDetailCtrl', function($scope, $stateParams, $http, $q, $ionicModal, $ionicSlideBoxDelegate) {

  //PlaceService.getDetails
  var request = {
    placeId: $stateParams.restaurantId
  };
  console.log("Id is: ");
  console.log($stateParams.restaurantId);
  map = new google.maps.Map(document.getElementById('map'));
  service = new google.maps.places.PlacesService(map);
  service.getDetails(request, callback);
  photos = [];

  function callback(place, status) {
    console.log("Status is: ");
    console.log(status);
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      $scope.restaurant = place;
      console.log(place);
      for(i=0; i<place.photos.length; i++) {
        src = place.photos[i].getUrl({'maxWidth': 400, 'maxHeight': 400});
        msg = "Image " + (i+1) + "/" + place.photos.length;
        photos.push({src:src,msg:msg});
      }
      $scope.$apply(function() {
        $scope.photos = photos;
      });
    }
  }

  //Image pop handling stuff
  $ionicModal.fromTemplateUrl('image-modal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $scope.openModal = function() {
      $ionicSlideBoxDelegate.slide(0);
      $scope.modal.show();
    };

    $scope.closeModal = function() {
      $scope.modal.hide();
    };

    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });
  
    $scope.$on('modal.hide', function() {
      
    });
  
    $scope.$on('modal.removed', function() {
      
    });
    $scope.$on('modal.shown', function() {
      console.log('Modal is shown!');
    });

    
    $scope.next = function() {
      $ionicSlideBoxDelegate.next();
    };
  
    $scope.previous = function() {
      $ionicSlideBoxDelegate.previous();
    };
  
    $scope.goToSlide = function(index) {
      $scope.modal.show();
      $ionicSlideBoxDelegate.slide(index);
    }
  
    $scope.slideChanged = function(index) {
      $scope.slideIndex = index;
    };
})

.controller('LoginCtrl', function($scope, $q, $ionicPopup, $state, LoginEndpoint, Favorites) {
 
 $scope.data = {};
 
 $scope.login = function() {

    $.ajax({
      type: 'GET',
      //url: LoginEndpoint.url + "/s/GetUserPhoto?email=" + $scope.data.username + "&size=HR64x64",
      url: 'https://outlook.office365.com/EWS/Exchange.asmx/s/GetUserPhoto?email=' + $scope.data.username + '&size=HR64x64',
      data: {},
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Authorization', 'Basic ' + window.btoa(unescape(encodeURIComponent($scope.data.username + ':' + $scope.data.password))));
      },
      success: function (data) {
      	  Favorites.saveCurrentSessionInfo($scope.data, data);
          $state.go('tab.restaurants');
          $scope.data = {};
      },
      error: function (xhr, err, abc) {
      	console.log("error");
        if(xhr.status==401 || xhr.status==0) {
          var alertPopup = $ionicPopup.alert({
                    title: 'Login Failed',
                    templateUrl: 'templates/login-error.html'
                });
        }
        else
          $state.go('tab.restaurants');
      }
    })     
  }
})

.controller('SettingsCtrl', function($scope, $ionicPopup, $state) {
  $scope.confirmLogout = function() {
    $ionicPopup.show({
        title: "Are you sure you?",
        scope: $scope,
        buttons: [
          { text: 'Cancel', onTap: function(e) { return true; } },
          { text: 'Log out', type: 'button-assertive', onTap: function(e) { $state.go('login'); }},
        ]
      }).then(function(res) {
        console.log('Tapped!', res);
      }, function(err) {
        console.log('Err:', err);
      }, function(popup) {
        savedPopup = popup;
      });  
    }  
});

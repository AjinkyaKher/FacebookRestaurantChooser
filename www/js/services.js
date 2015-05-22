angular.module('starter.services', [])

.factory('Favorites', function($q) {

  //Initialize db
  var userData = {};
  var db = new PouchDB('restaurants', {adapter: 'websql'});
  var remoteCouch = "https://ajinkya.iriscouch.com/restaurants";

  //Sync db
  console.log('syncing');
  var opts = {live: true};
  db.replicate.to(remoteCouch, opts, syncError);
  db.replicate.from(remoteCouch, opts, syncError);
  function syncError() {
    console.log('error');
  }

  return {
    choose: function(restaurant) {   
      //save the restaurant like as a doc in CouchDB
      userData.data.username = userData.data.username.toLowerCase();
      var likes = {
        _id: userData.data.username.toLowerCase(),
        likes: restaurant.name
      };

      //Check if doc exists, and update it
      var query = db.get(userData.data.username).then(function(doc) { 
        //Ignore already liked restaurant
        likedRestaurants = doc.likes.split(",");
        if(likedRestaurants.indexOf(restaurant.name) > -1) {
          console.log("You got it");
          return;
        }
        return db.put({_id:userData.data.username, likes:doc.likes+","+restaurant.name, _rev:doc._rev}); 
      });

      query.then(function(resp) { 
        console.log("doc updated");
        console.log(resp); 
      });

      //If not, add a new one
      query.catch(function(err) {
        console.log("doc doesn't exist");
        db.put({_id:userData.data.username, likes:restaurant.name}).then(function(doc) { 
          console.log("doc created"); 
          console.log(doc);
        }).catch(function(err2) {
          console.log("doc could not be created");
          console.log(err2);
        })
      });
    },
    delete: function(user, likes, dislikedRestaurant) {
      var deferred = $q.defer();
      var index = likes.indexOf(dislikedRestaurant);
      if(index > -1) {
        likes.splice(index, 1);

        //delete doc
        if(likes.length == 0) {
          db.get(user).then(function(doc) { 
            return db.remove(doc);}).then(function (result) {
            console.log("doc deleted");
            console.log(result); 
            deferred.resolve(false);
          }).catch(function (err) {
            console.log(err);
          });
        }
        //update doc
        else {
          var query = db.get(userData.data.username).then(function(doc) { 
            return db.put({_id:userData.data.username, likes:likes.toString(), _rev:doc._rev}); 
          });
          query.then(function(resp) { 
            console.log("doc updated after deleting a like");
            console.log(resp);
            deferred.resolve(true); 
          });
        }
      }
      return deferred.promise;
    }, 
    get: function() {
      var deferred = $q.defer();
      //Return all the docs
      db.allDocs({include_docs:true, descending:true}).then(function(doc) {
       console.log("docs fetched");
       favorites = [];
       for(i=0;i<doc.rows.length;i++) {
        name = doc.rows[i].doc._id.split("@")[0];
        likes = doc.rows[i].doc.likes;
        photo = "https://outlook.office365.com/EWS/Exchange.asmx/s/GetUserPhoto?email=" + doc.rows[i].doc._id + "&size=HR64x64";
        currentUser = false;
        if(doc.rows[i].doc._id == userData.data.username.toLowerCase())
          currentUser = true;
        favorites.push({name: name, likes: likes, photo: photo, currentUser: currentUser});
        //Allow images to load
        $.ajax({
            type: "GET",
            url: "https://outlook.office365.com/EWS/Exchange.asmx/s/GetUserPhoto?email=" + doc.rows[i].doc._id + "&size=HR64x64",
            data: {},
            beforeSend: function(xhr) {
              xhr.setRequestHeader('Authorization', 'Basic ' + window.btoa(unescape(encodeURIComponent(userData.data.username + ':' + userData.data.password))));
            },
            success: function (data) {
              console.log("Donedeal");
            },
            error: function (xhr, err, abc) {
              console.log("errordeal");
            }        
          })
      }
      console.log("fav");
      console.log(favorites);
      deferred.resolve(favorites);
    }).catch(function(err) {
      console.log("Error fetching docs");
      console.log(err);
     })
     return deferred.promise;
    },
    saveCurrentSessionInfo: function(data, photo) {
      console.log("Saving");
      userData = {data: data, photo: photo};
      console.log(userData);
    }
  };
});
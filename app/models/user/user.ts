import {Injectable, Inject} from 'angular2/core';
import {FirebaseAuth, AuthProviders, FirebaseAuthState} from 'angularfire2';

@Injectable()
export class User {
    firebaseAuthState: FirebaseAuthState;
    user: any;
    ref: String;
    userConnectionString: any;
    userRef: Firebase;
    userConnectionsRef: Firebase;
    userLastOnlineRef: Firebase;
    connectedRef: Firebase;
    users: any;
    missions: any;
    online: any;
    leaderboard: any;
    leaderboardBase: any;
    constructor(
        @Inject(FirebaseAuth) public auth: FirebaseAuth
        ) {
        var user = this;    
        user.ref = 'https://aofs.firebaseio.com';
        var leaderboardRef = user.ref + '/leaderboard';
        user.leaderboardBase = new Firebase(leaderboardRef);
        this.auth.subscribe(
            function(x) {
                if (!x) return; 
                console.log('Next: ' + x.toString());
                user.setUser(x);
            },
            function(err) {
                console.log('Error: ' + err);
            },
            function() {
                console.log('Completed');
            });
            
        user.getUsers();
        
        user.connectedRef = new Firebase(user.ref + '/.info/connected');
        user.user = {name: 'Anonymous User', profileLocation: 'local', 
            profile: {profileImageURL:'http://www.psdgraphics.com/file/male-silhouette.jpg'}};
            
        user.connectedRef.on('value', user.onConnectedRefChange);
        user.getMissions();
        user.getLeaderboard();
    }
    
    onConnectedRefChange(snap) {
        var user = this;
        return;
       /* if ((snap.val() === true) && (user.userConnectionsRef !== undefined)) {
                var con = user.userConnectionsRef.push(true);
                con.onDisconnect().remove();
                user.userLastOnlineRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
        }*/
    }
    saveStory(story) {
        var user = this;
        /*
        if (story.firebase === undefined) {
            // Generate a reference to a new location and add some data using push()
            var newPostRef = user.userRef.child('missions').push(story);
            if (user.user.missions === undefined) user.user.missions=[];
            user.user.missions.push(story);
            // Get the unique ID generated by push()
            var postID = newPostRef.key();
            story.firebase = postID;
            user.saveStory(story);
        }
        else {       
            user.userRef.child('missions').child(story.firebase).set(story);
            */     
            if (user.user.missions === undefined) user.user.missions=[];
            user.user.missions[story.id]=story; 
            
            var count = user.getPointsTotal(story.points);
            console.log("Saving Points: "+ story.id +" of " + count);
         //   user.userRef.child('points').child(story.id).set(count);
            if ( story.pointsTotal < count ) story.pointsTotal = count;
            else  count = story.pointsTotal;
           
            if (user.user.point===undefined)user.user.point=[];
            if (user.user.point[story.id] < count ) user.user.point[story.id] = count;
            else {
                count = user.user.point[story.id];
            }
            user.save();
            
            count = user.getPointsTotal(user.user.points);
            console.log("Saving Points: "+ user.user.name +" of " + count);
            user.userRef.child('points').child(story.id).set(count);
            user.leaderboardBase.child(user.user.name).set(count);
            story.userTotal=count;
            return story;
      //  }
    }
    getPointsTotal(pointsList) {
        var count = 0;
            for (var key in pointsList) {
                if (pointsList.hasOwnProperty(key)) {
                    console.log(key + " -> " + pointsList[key]);
                    count = count + pointsList[key];
                   } 
                }
                return count
    }
    save() {
        var user = this;
        user.userRef.set(user.user);
    }
    setUser(authData) {
        var user=this;
        if (!authData) {
            console.log('AuthData null');
            return;
        }
        var name = authData[authData.auth.provider].displayName.replace(/\s+/g, '');
        user.userConnectionString = user.ref + '/users/' + name.tobase64url();
        user.userRef = new Firebase(user.userConnectionString);
        user.userRef.once('value').then((d) => {
            user.user = d.val();
            if (user.user === null) user.user = {};
            user.user.name = name;
            user.user.pointsTotal = user.getPointsTotal(user.user.points);
            user.user.id = name.tobase64url();
            user.user.profileProvider = authData.auth.provider;
            user.user.profile = authData[user.user.profileProvider];
            user.userConnectionsRef = new Firebase(user.userConnectionString + '/connections');
            user.userLastOnlineRef = new Firebase(user.userConnectionString + '/lastOnline');
            user.save();
            return d;
        });
    }
    public doLogin() {
        var start = this;
        // This will perform popup auth with google oauth and the scope will be email
        // Because those options were provided through bootstrap to DI, and we're overriding the provider.
        this.auth.login({
            provider: AuthProviders.Facebook
        }).then(function(value) {
            start.firebaseAuthState = value;
        });;
    }
    public doLogout() {
        this.auth.logout();
        this.user = {name: 'Anonymous User', profileLocation: 'local', 
            profile: {profileImageURL:'http://www.psdgraphics.com/file/male-silhouette.jpg'}};
    }
    
    getLastOnline(userName) {
        var user = this;
        var returnDate;
        try {
            var date = new Date(user.users[userName].lastOnline);
            returnDate = date.toJSON();
        } catch (err) {
            returnDate = 'UNKNOWN';
        }
        if (user.users[userName].connections !== undefined) returnDate = 'Is currently online.';
        return returnDate;
    }
    
    getUsers() {
        var user=this;
        if ((user.users === undefined) ||
            (user.userRef !== undefined)) {
            var usersConnectionString = user.ref + '/users';
            var us = new Firebase(usersConnectionString);
            us.once('value').then((d) => {
                    user.users = d.val();
                    user.online = Object.keys(user.users).length;
             });
        }
    }
    
    getLeaderboard() {
        var user = this;
        user.leaderboardBase.once('value').then((d) => {
           if (!user.leaderboard) user.leaderboard=[]; 
           var leaderboard = d.val();
                for (var key in leaderboard) {
                    if (leaderboard.hasOwnProperty(key)) {
                        console.log(key + " -> " + leaderboard[key]);
                        var o = {name:key,points:leaderboard[key]}
                        user.leaderboard.push(o); 
                   }
                }
        });
    }
    getMissions() {
        var user = this;
        var missionsConnectionString = user.ref + '/missions';
            var us = new Firebase(missionsConnectionString);
            us.once('value').then((d) => {
                user.missions = d.val();
             });
    }
}
  
  
  
  /*
        
    setProperty(key, value) {
        var user = this;
        user.user[key] = value;
        user.save();
    }
    getProperty(key) {
        return user.user[key];
    }
    setEditLocation(usereditRefString) {
        user.editLocationConnectionsRef = new Firebase(ref + '/' + editRefString + '/' + user.user.name + '/connections');
        user.editLocationLastOnlineRef = new Firebase(ref + '/' + editRefString + '/' + user.user.name + '/lastOnline');
    }
    getImage(userName, source) {
        var returnImage = 'assets/images/logo.png', 
            loggedInImage;
        if (user.user === undefined) return returnImage;
        try {
            loggedInImage = user.user.profile.profileImageURL;
        } catch (err) {
            console.log(err);
        }
        if (source === user.user.profileProvider) {
            if (loggedInImage !== undefined) returnImage = loggedInImage;
        }
        if (source === undefined) {
            if (loggedInImage !== undefined) returnImage = loggedInImage;
        }
        return returnImage;
    }
}
                                */
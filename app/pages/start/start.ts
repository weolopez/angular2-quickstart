import {Page, NavController, NavParams} from 'ionic-angular';
import {Status} from '../../components/status/status';
import {Gamebar} from '../../components/gamebar/gamebar';
import {Story} from '../../models/story/story';
import {User} from '../../models/user/user';
import {Map} from '../../components/map/map';

@Page({
    templateUrl: 'build/pages/start/start.html',
    directives: [Status, Map, Gamebar]
})
export class Start {
    tab: any = '';
    nav: any;
    story: Story;
    user: User;
    constructor(
        nav: NavController,
        private s: Story,
        u: User
    ) {
        this.nav = nav;
        this.story = s;
        this.user = u;
    }
    openPage() {
        this.story.next();
    }
    getOtherMissions() {
        var start = this;

        if (start.user.missions[0] !== null) {
            if (!start.story.stories.cloud) start.story.stories.cloud = [];
            start.story.stories.cloud.push(start.user.missions[0]);
        }
        if (start.user.user.missions[0] !== null) {
            if (!start.story.stories.my) start.story.stories.my = [];
          //  Object.keys(start.user.user.missions).reduce( ())
            start.story.stories.my.push(start.user.user.missions);
        }
    }
}

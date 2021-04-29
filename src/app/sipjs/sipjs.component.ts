import {Component, OnInit} from '@angular/core';
import {
  SimpleUser,
  SimpleUserDelegate,
  SimpleUserOptions,
} from 'sip.js/lib/platform/web';
import {URI} from 'sip.js';

@Component({
  selector: 'sipjs',
  templateUrl: './sipjs.component.html',
  styleUrls: ['./sipjs.component.scss']
})
export class SipjsComponent implements OnInit {
  public remoteAudio = new window.Audio();

  public number = '5555';
  public webSocketServer = 'wss://10.98.76.88:4443/ws';
  public displayName = 'test';

  public simpleUserDelegate: SimpleUserDelegate = {
    onCallCreated: (): void => {
      console.log('onCallCreated');
    },
    onCallAnswered: (): void => {
      console.log('onCallAnswered');
    },
    onCallHangup: (): void => {
      console.log('onCallHangup');
    },
  };

  public simpleUserOptions: SimpleUserOptions = {
    delegate: this.simpleUserDelegate,
    media: {
      remote: {
        audio: this.remoteAudio,
      },
      constraints: {
        video: false,
        audio: true,
      },
    },
    userAgentOptions: {
      displayName: this.displayName,
      uri: new URI('sip', '5025', '10.98.76.88'),
      authorizationPassword: '5025',
      authorizationUsername: '5025',
    }
  };

  public simpleUser: SimpleUser;

  ngOnInit(): void {
    this.simpleUser = new SimpleUser(this.webSocketServer, this.simpleUserOptions);
  }

  public connect(): void {
    this.simpleUser
      .connect()
      .then(() => {
        console.log('connected');
      })
      .catch((e) => {
        console.error('failed to connect', e);
      });
  }

  public disconnect(): void {
    this.simpleUser
      .disconnect()
      .then(() => {
        console.log('disconnected');
      })
      .catch((e) => {
        console.error('failed to disconnect', e);
      });
  }

  public call(): void {
    this.simpleUser
      .call(`sip:${this.number}@10.98.76.88`, {
        inviteWithoutSdp: false
      }, { withoutSdp: false})
      .catch((e) => {
        console.error('failed to call', e);
      });
  }

  public hangup(): void {
    this.simpleUser
      .hangup()
      .catch((e) => {
        console.error('failed to hangup', e);
      });
  }
}

import { Component } from '@angular/core';
import {debug, UA, WebSocketInterface} from 'jssip';
import {RTCSession, SDPEvent} from 'jssip/lib/RTCSession';
import {CallOptions, UAConfiguration} from 'jssip/lib/UA';

debug.enable('JsSIP:*');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public ua: UA;
  public session: RTCSession;
  public remoteAudio = new window.Audio();

  public number = '5555';
  public domain = '10.98.76.88';

  public options: CallOptions = {
    eventHandlers: {
      progress: (e) => {
        console.log('call is in progress');
        this.session.connection.ontrack = (rTCTrackEvent) => {
          console.log(rTCTrackEvent);
          this.remoteAudio.srcObject = rTCTrackEvent.streams[0];
          this.remoteAudio.play();
        };
      },
      failed: (e) => {
        console.log('call failed with cause: ', e);
      },
    },
    mediaConstraints: { audio: true, video: false }
  };

  public onLoginClick(): void {
    this.remoteAudio.autoplay = true;
    const socket = new WebSocketInterface('wss://' + this.domain + ':8080/ws');
    const configuration: UAConfiguration & any = {
      sockets: [socket],
      uri: '5025' + '@' + this.domain,
      authorization_user: '5025',
      realm: this.domain,
      registrar_server: this.domain,
      password: '5025',
      display_name: 'test',
      traceSip: true,
    };

    this.ua = new UA(configuration);
    this.ua.start();

    this.ua.on('connected', (e) => {
      console.log('connected', e);
    });

    this.ua.on('newRTCSession', (data) => {
      const session = data.session;

      if (session.direction === 'incoming') {
        session.answer(this.options);
      }
    });

    this.ua.on('registered', (e) => {
      console.log('registered', e);
    });
  }

  public call(): void {
    console.log('call');
    this.ua.call('sip:' + this.number + '@' + this.domain, this.options);

    this.remoteAudio.src = '../assets/outgoing.mp3';
    this.remoteAudio.load();
  }

  public hangup() {
    if (this.session) {
      this.session.terminate();
    }
  }
}

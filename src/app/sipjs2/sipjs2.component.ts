import {Component, OnInit} from '@angular/core';
import {
  defaultMediaStreamFactory,
  defaultPeerConnectionConfiguration,
  SessionDescriptionHandler,
  SessionDescriptionHandlerConfiguration,
  SessionDescriptionHandlerFactoryOptions,
  SimpleUser,
  SimpleUserDelegate,
  SimpleUserOptions,
} from 'sip.js/lib/platform/web';
import {
  BodyAndContentType,
  Session,
  SessionDescriptionHandlerFactory,
  SessionDescriptionHandlerModifier,
  SessionDescriptionHandlerOptions,
  URI
} from 'sip.js';

@Component({
  selector: 'sipjs2',
  templateUrl: './sipjs2.component.html',
  styleUrls: ['./sipjs2.component.scss']
})
export class Sipjs2Component implements OnInit {
  public remoteAudio = new window.Audio();

  public number = '5555';
  public webSocketServer = 'wss://10.98.76.88:8080/ws';
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
    },
    userAgentOptions: {
      logLevel: 'debug',
      displayName: this.displayName,
      uri: new URI('sip', '5025', '10.98.76.88'),
      authorizationPassword: '5025',
      authorizationUsername: '5025',
      sessionDescriptionHandlerFactory: defaultSessionDescriptionHandlerFactory2(),
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
        inviteWithoutSdp: false,
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


export function defaultSessionDescriptionHandlerFactory2(
  mediaStreamFactory?: (
    constraints: MediaStreamConstraints,
    sessionDescriptionHandler: SessionDescriptionHandler
  ) => Promise<MediaStream>
): SessionDescriptionHandlerFactory {
  return (session: Session, options?: SessionDescriptionHandlerFactoryOptions): SessionDescriptionHandler => {
    if (mediaStreamFactory === undefined) {
      mediaStreamFactory = defaultMediaStreamFactory();
    }

    const iceGatheringTimeout = options?.iceGatheringTimeout !== undefined ? options?.iceGatheringTimeout : 5000;

    const sessionDescriptionHandlerConfiguration: SessionDescriptionHandlerConfiguration = {
      iceGatheringTimeout,
      peerConnectionConfiguration: {
        ...defaultPeerConnectionConfiguration(),
        ...options?.peerConnectionConfiguration
      }
    };

    const logger = session.userAgent.getLogger('sip.SessionDescriptionHandler');
    return new SessionDescriptionHandler2(logger, mediaStreamFactory, sessionDescriptionHandlerConfiguration);
  };
}


class SessionDescriptionHandler2 extends SessionDescriptionHandler {

  public getDescription(
    options?: SessionDescriptionHandlerOptions,
    modifiers?: Array<SessionDescriptionHandlerModifier>
  ): Promise<BodyAndContentType> {
    console.log('--------------000------------------------------------------------');

    console.log(options);
    console.log(modifiers);

    return super.getDescription(options, [stripRtpPayload2('')]);
  }

  // public setDescription(
  //   sdp: string,
  //   options?: SessionDescriptionHandlerOptions,
  //   modifiers?: Array<SessionDescriptionHandlerModifier>
  // ): Promise<void> {
  //   this.logger.debug('SessionDescriptionHandler.setDescription');
  //   if (this._peerConnection === undefined) {
  //     return Promise.reject(new Error('Peer connection closed.'));
  //   }
  //
  //   this.onDataChannel = options?.onDataChannel;
  //
  //   const type = this._peerConnection.signalingState === 'have-local-offer' ? 'answer' : 'offer';
  //
  //   return this.getLocalMediaStream(options)
  //     .then(() => this.applyModifiers({ sdp, type }, modifiers))
  //     .then((sessionDescription) => this.setRemoteSessionDescription(sessionDescription))
  //     .catch((error) => {
  //       this.logger.error('SessionDescriptionHandler.setDescription failed - ' + error);
  //       // throw error;
  //     });
  // }
}


function stripRtpPayload2(payload: string): SessionDescriptionHandlerModifier {
  return (description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> => {
    console.log(description);

    description.sdp = description.sdp.replace('a=rtpmap:109 opus/48000/2\r\n', '');
    description.sdp = description.sdp.replace('a=rtpmap:9 G722/8000/1\r\n', '');
    description.sdp = description.sdp.replace('a=rtpmap:8 PCMA/8000\r\n', '');

    const parts = description.sdp.split('m=audio ');
    const part1 = parts[0];
    const part2 = parts[1].split('UDP/TLS/RTP/SAVPF 109 9 0 8 101')[1];
    description.sdp = part1 + 'm=audio 8000 RTP/AVP 106 9 98 101 0 8 3' + part2;
    // description.sdp = description.sdp.replace(
    //   'UDP/TLS/RTP/SAVPF 109 9 0 8 101',
    //   'RTP/AVP 106 9 98 101 0 8 3'
    // );
    // description.sdp = description.sdp.replace('a=rtpmap:101 telephone-event/8000/1\r\n', '');

    console.log(description);
    return Promise.resolve(description);
  };
}

const stripPayload = (sdp: string, payload: string): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mediaDescs: Array<any> = [];

  const lines: Array<string> = sdp.split(/\r\n/);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentMediaDesc: any;
  for (let i = 0; i < lines.length;) {
    const line: string = lines[i];
    if (/^m=(?:audio|video)/.test(line)) {
      currentMediaDesc = {
        index: i,
        stripped: []
      };
      mediaDescs.push(currentMediaDesc);
    } else if (currentMediaDesc) {
      const rtpmap = /^a=rtpmap:(\d+) ([^/]+)\//.exec(line);
      if (rtpmap && payload === rtpmap[2]) {
        lines.splice(i, 1);
        currentMediaDesc.stripped.push(rtpmap[1]);
        continue; // Don't increment 'i'
      }
    }

    i++;
  }

  for (const mediaDesc of mediaDescs) {
    const mline: Array<string> = lines[mediaDesc.index].split(' ');

    // Ignore the first 3 parameters of the mline. The codec information is after that
    for (let j = 3; j < mline.length;) {
      if (mediaDesc.stripped.indexOf(mline[j]) !== -1) {
        mline.splice(j, 1);
        continue;
      }
      j++;
    }

    lines[mediaDesc.index] = mline.join(' ');
  }

  return lines.join('\r\n');
};

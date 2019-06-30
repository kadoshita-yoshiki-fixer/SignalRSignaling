// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your Javascript code.

let connection = new signalR.HubConnectionBuilder().withUrl('/signalingHub').build();

let localStream = null;
let pc = null;

let createPeerConnection = () => {
    let _pc = new RTCPeerConnection({
        iceServers: [{
            urls: 'stun:stun.l.google.com:19302'
        }]
    });

    _pc.ontrack = e => {
        $('#remoteVideo').get(0).srcObject = e.streams[0];
    };

    _pc.onicecandidate = e => {
        console.log(e);
        if (e.candidate) {
            connection.invoke('SendSDP', JSON.stringify({ type: 'candidate', ice: e.candidate }))
                .catch(err => console.error(err));
        }
    };

    _pc.addStream(localStream);

    return _pc;
};
connection.on('ReceiveSDP', sdpStr => {
    let sdpObject = JSON.parse(sdpStr);
    switch (sdpObject.type) {
        case 'offer':
            let offer = new RTCSessionDescription(sdpObject);
            //setOffer
            if (pc) {
                console.error('peerConnection exist');
                return;
            }
            pc = createPeerConnection();
            pc.setRemoteDescription(offer).then(() => {
                //makeAnswer
                pc.createAnswer().then(sdp => {
                    return pc.setLocalDescription(sdp);
                }).then(() => {
                    connection.invoke('SendSDP', JSON.stringify(pc.localDescription));
                }).catch(err => {
                    console.error(err);
                });
            });
            break;
        case 'answer':
            let answer = new RTCSessionDescription(sdpObject);
            //setAnswer
            if (!pc) {
                console.error('peerConnection not exist');
                return;
            }
            pc.setRemoteDescription(answer).catch(err => console.error(err));
            break;
        case 'candidate':
            let candidate = new RTCIceCandidate(sdpObject.ice);
            //addIceCandidate
            if (!pc) {
                console.error('peerConnection not exist');
                return;
            }
            pc.addIceCandidate(candidate);
            break;
        default:
            break;
    }
});

connection.start().then(() => {
    console.log('connection start');
}).catch(err => console.error(err));

$('#connect').on('click', () => {
    //makeOffer
    pc = createPeerConnection();
    pc.createOffer().then(sdp => {
        return pc.setLocalDescription(sdp);
    }).then(() => {
        connection.invoke('SendSDP', JSON.stringify(pc.localDescription));
    }).catch(err => {
        console.error(err);
    });
});

$(document).ready(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        localStream = stream;
        $('#localVideo').get(0).srcObject = stream;
    }).catch(err => console.error(err));
});
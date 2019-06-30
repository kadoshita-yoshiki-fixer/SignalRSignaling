using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace SignalRSignaling.Hubs
{
    public class SignalingHub : Hub
    {
        public async Task SendSDP(string sdp)
        {
            System.Diagnostics.Debug.WriteLine(sdp);
            await Clients.Others.SendAsync("ReceiveSDP", sdp);
        }
    }
}
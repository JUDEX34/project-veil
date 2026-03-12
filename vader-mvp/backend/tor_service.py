import time
from stem.control import Controller
from stem.process import launch_tor_with_config

import os
import shutil

def find_tor_executable():
    # 1. Check if Tor is in the system PATH
    if shutil.which("tor"):
        return "tor"
    
    # 2. Check common Tor Browser install locations on Windows
    common_paths = [
        os.path.expanduser(r"~\Desktop\Tor Browser\Browser\TorBrowser\Tor\tor.exe"),
        os.path.expanduser(r"~\Tor Browser\Browser\TorBrowser\Tor\tor.exe"),
        r"C:\Tor Browser\Browser\TorBrowser\Tor\tor.exe"
    ]
    for p in common_paths:
        if os.path.exists(p):
            return p
            
    return None

def start_tor_hidden_service(port_to_forward=8000):
    tor_cmd = find_tor_executable()
    
    if not tor_cmd:
        print("ERROR: Tor executable not found!")
        print("Please install the Tor Browser or the Tor Expert Bundle.")
        print("If installed in a custom location, add it to your system PATH or update 'find_tor_executable()'.")
        return None, None

    print(f"Starting Tor process using: {tor_cmd}")
    try:
        tor_process = launch_tor_with_config(
            tor_cmd=tor_cmd,
            config={
                'SocksPort': '9050',
                'ControlPort': '9051',
                'CookieAuthentication': '1',
            },
            take_ownership=True,
        )
    except Exception as e:
        print(f"Error launching Tor: {e}")
        return None, None

    with Controller.from_port(port=9051) as controller:
        controller.authenticate()
        
        # Create an ephemeral hidden service
        # It won't touch the disk and will disappear when Tor exits
        response = controller.create_ephemeral_hidden_service(
            {80: port_to_forward},
            await_publication=True
        )
        
        onion_address = response.service_id + ".onion"
        print(f"\n*** EPHEMERAL HIDDEN SERVICE CREATED ***")
        print(f" * Onion Address: {onion_address}")
        print(f" * Forwarding Port 80 to locally running {port_to_forward}\n")
        
        return tor_process, onion_address

if __name__ == '__main__':
    tor_proc, onion_addr = start_tor_hidden_service()
    if tor_proc:
        try:
            print("Tor Hidden Service running. Press Ctrl+C to stop.")
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down Tor...")
            tor_proc.kill()

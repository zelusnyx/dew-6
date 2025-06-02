#!/usr/bin/env python3
import xir

site = xir.Network({})

# minnowboards
minnows = [ site.node({
    'name': 'minnow'+str(i),
    'platform': 'minnowboard',
    'cpu': { 'model': 'atom', 'arch': 'x86_64', 'cores': 2 },
    'bus': [{ 'type': 'pci3' }],
    'memory': { 'capacity': xir.gB(1) },
    'disk': { 'capacity': xir.gB(64) },
    'image': ['riot', 'debian', 'fedora', 'riot-18.01', 'debian-9', 'fedora-27'],
    'alloc': ['unit']
    },
    [xir.Endpoint({'type': 'ethernet', 'speed': xir.gbps(1), 'bus': 'pcie3'})]
    ) for i in range(4) ]

# raspberry pis
pis = [ site.node({
    'name': 'pi'+str(i),
    'platform': 'rpi',
    'cpu': { 'arch': 'armv7', 'cores': 2 },
    'bus': [{ 'type': 'usb2' }],
    'memory': { 'capacity': xir.gB(1) },
    'disk': { 'capacity': xir.gB(16) },
    'alloc': ['unit'],
    'image': [
        'riot', 'riot-18.01', 
        'raspbian', 'raspbian-17.11'],
    },
    [xir.Endpoint({ 
        'type': 'xbee', 
        'speed': xir.mbps(1), 
        'bus': 'usb2'})]
    ) for i in range(4) ]

# network
xbee = site.node({
    'name': 'xbee',
    'alloc': ['static', 'virtual']
    } ,
    [xir.Endpoint({
        'type': 'xbee', 
        'speed': xir.mbps(1)}
        ) for _ in range(9)]
    )

# hummingbrid node
hb = site.node({
    'name': 'hummingbird',
    'alloc': ['static', 'virtual']
    },
    [xir.Endpoint({'type': 'ethernet', 'speed': xir.gbps(10)}) for _ in range(2) ] 
    )

# do not model uplinks to internet or control plane links, just experiment
# plane downlinks
gw = site.node({
    'name': 'gateway',
    'alloc': ['static', 'virtual']
    },
    [xir.Endpoint({'type': 'ethernet', 'speed': xir.gbps(10)}) for _ in range(1) ] 
    )

# link up minnowboards
for i,x in enumerate(minnows):
    site.link([x.endpoints[0], xbee.endpoints[i]], {})

    # link up raspberry pis
for i,x in enumerate(pis):
    site.link([x.endpoints[0], xbee.endpoints[len(minnows)+i]], {})

# link up egress path
site.link([xbee.endpoints[8], hb.endpoints[0]], {})
site.link([hb.endpoints[0], gw.endpoints[0]], {})

print(site.xir())


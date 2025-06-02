#!/usr/bin/env python3
import xir

site = xir.Network({})

# hardware definitions

def node_mu(name):
    nic = x710da4()
    return site.node({
        'name': name,
        'platform': 'supermicro',
        'cpu': { 'model': 'xeon', 'arch': 'x86_64', 'cores': 32 },
        'bus': [{ 'type': 'pci3', 'components': [nic] }],
        'memory': { 'capacity': xir.gB(64) },
        'disk': { 'capacity': xir.tB(2) },
        'image': ['debian', 'debian-9', 'centos', 'centos-7', 'ubuntu', 'ubuntu-1604'],
        'alloc': ['virtual', 'unit'],
        'virtmin': {
            'cpu': { 'cores': xir.eq(1) },
            'memory': { 'capacity': xir.eq(xir.mB(256)) },
            'disk': { 'capacity': xir.eq(xir.gB(25)) }
            },
        },
        list(map(lambda x: xir.Endpoint(x), nic['ports']))
    )


def net_mu(name):
    nic = netronome()
    return site.node({
        'name': name,
        'platform': 'supermicro',
        'cpu': { 'model': 'xeon', 'arch': 'x86_64', 'cores': 4 },
        'bus': [{ 'type': 'pci3', 'components': [nic] }],
        'memory': { 'capacity': xir.gB(4) },
        'disk': { 'capacity': xir.tB(1) },
        'image': [
            'lte-linux', 'lte-linux-2.1', 'lte-linux-2.2',
            'cumulus', 'cumulus-3', 'cumulus-3.5', 'cumulus-2', 'cumulus-2.7'
            ],
        'alloc': ['virtual', 'unit'],
        'virtmin': {
            'cpu': { 'cores': xir.eq(1) },
            'memory': { 'capacity': xir.eq(xir.mB(256)) },
            'disk': { 'capacity': xir.eq(xir.gB(25)) }
            }
        },
        list(map(lambda x: xir.Endpoint(x), nic['ports']))
    )

def x710da4():
    id = str(xir.uid())
    return {
            'id': id,
            'type': 'nic',
            'model': 'xl710da4',
            'capability': ['dpdk'],
            'ports': [{'type': 'ethernet', 'speed': xir.gbps(10), 'nic': id} for _ in range(4)]
            }

def netronome():
    id = str(xir.uid())
    return {
            'id': id,
            'type': 'nic',
            'model': 'netronome',
            'capability': ['dpdk', 'p4'],
            'ports': [{'type': 'ethernet', 'speed': xir.gbps(40), 'nic': id} for _ in range(2)]
            }

#nodes
nodemu = [ node_mu('nodemu'+str(i)) for i in range(4) ]
netmu = [ net_mu('netmu'+str(i)) for i in range(4) ]

#switch
switch = site.node({
    'name': 'switch',
    'platform': 'cumulus',
    'alloc': ['virtual'],
    'capability': ['switch'],
    },
    [xir.Endpoint({'type': 'ethernet', 'speed': xir.gbps(1)}) for _ in range(9)]
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

# link up nodemus
for i,x in enumerate(nodemu):
    site.link([
        x.endpoints[0], 
        switch.endpoints[i]
    ],{})

# link up netmus
for i,x in enumerate(netmu):
    site.link([
        x.endpoints[0],
        switch.endpoints[len(nodemu)+i]
    ],{})

# link up egress path
site.link([switch.endpoints[8], hb.endpoints[0]], {})
site.link([hb.endpoints[0], gw.endpoints[0]], {})

print(site.xir())
